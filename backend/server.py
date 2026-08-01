import os
import json
import time
import concurrent.futures
from http.server import HTTPServer, BaseHTTPRequestHandler

# Utility to mask NDPA sensitive data
def mask_string(s, visible_chars=4):
    if not s:
        return '***'
    s = str(s)
    if len(s) <= visible_chars:
        return s
    return '*' * (len(s) - visible_chars) + s[-visible_chars:]

# 1. Concrete Python Micro-Agents
class DeviceAgent:
    def name(self): return "device_agent"
    def evaluate(self, payload):
        risk = 0.0
        flags = []
        device = payload.get("device_context", {})
        
        # Simulating profile checks
        if device.get("is_rooted"):
            risk += 0.50
            flags.append("ERR_DEVICE_INTEGRITY_ROOTED")
        if device.get("is_emulator"):
            risk += 0.40
            flags.append("ERR_DEVICE_EMULATOR_DETECTED")
        if device.get("has_vpn_active"):
            risk += 0.15
            flags.append("ERR_VPN_ACTIVE_LOCATION_MASK")

        return {
            "risk_contribution": risk,
            "status": "ANOMALOUS" if risk > 0.40 else "VERIFIED",
            "flags": flags
        }

class BehavioralAgent:
    def name(self): return "behavioral_agent"
    def evaluate(self, payload):
        risk = 0.0
        flags = []
        behavioral = payload.get("behavioral_telemetry", {})
        
        if behavioral.get("input_method") == "PASTED_FROM_CLIPBOARD":
            risk += 0.45
            flags.append("ERR_PASTED_ACCOUNT_FAST_SUBMIT")
        
        dwell = behavioral.get("keystroke_dwell_time_avg_ms", 0)
        if dwell > 150.0 or (dwell > 0 and dwell < 40.0):
            risk += 0.20
            flags.append("ERR_TYPING_CADENCE_MISMATCH")

        pressure = behavioral.get("touch_pressure_normalized", 0.5)
        if pressure < 0.15 or pressure > 0.85:
            risk += 0.15
            flags.append("ERR_PRESSURE_DEVIATION")

        return {
            "risk_contribution": risk,
            "status": "SUSPICIOUS" if risk > 0.30 else "NORMAL",
            "flags": flags
        }

class VelocityAgent:
    def name(self): return "velocity_agent"
    def evaluate(self, payload):
        risk = 0.0
        flags = []
        
        source = payload.get("source_account", {})
        amount = payload.get("payment_details", {}).get("amount_ngn", 0)
        rolling_24h_spend = payload.get("rolling_24h_spend", 0.0) # Client or cache aggregate
        days_since_bind = source.get("days_since_reactivation", 999)

        # 2026 CBN July 24-hour cooling limit (₦20,000 aggregate cap)
        if days_since_bind <= 1:
            if (rolling_24h_spend + amount) > 20000.00:
                return {
                    "risk_contribution": 1.00,
                    "status": "BREACH",
                    "flags": ["ERR_CBN_2026_COOLOFF_ACCUMULATED_OUTFLOW_EXCEEDED"]
                }

        # Dormancy reactivation guard
        if days_since_bind > 180 and amount > 50000.00:
            risk += 0.50
            flags.append("ERR_DORMANT_ACCOUNT_HIGH_VALUE_REACTIVATION")

        return {
            "risk_contribution": risk,
            "status": "BREACH" if risk > 0.40 else "NORMAL",
            "flags": flags
        }

class GraphAgent:
    def name(self): return "graph_mule_agent"
    def evaluate(self, payload):
        risk = 0.0
        flags = []
        dest = payload.get("destination_account", {})
        ref = payload.get("payment_details", {}).get("payment_reference", "")
        amount = payload.get("payment_details", {}).get("amount_ngn", 0)

        # A: Farmed Mule Network Check
        if "NEOBANK" in dest.get("institution_type", "") and amount > 15000:
            risk += 0.50
            flags.append("MULE_NETWORK_CLUSTER_TARGET_CONNECTED")

        # B: Layering circular loops
        if "Crypto" in ref or "buy" in ref:
            risk += 0.40
            flags.append("CIRCULAR_TRANSFERS_LAYERING_LOOP")

        return {
            "risk_contribution": risk,
            "status": "SUSPICIOUS" if risk > 0.40 else "NORMAL",
            "flags": flags
        }

# 2. Parallel Orchestrator Logic
class FraudOrchestrator:
    def __init__(self):
        self.agents = [DeviceAgent(), BehavioralAgent(), VelocityAgent(), GraphAgent()]

    def process_transaction(self, payload):
        start_time = time.time()
        agent_breakdown = {}
        composite_risk = 0.0

        # Execute concurrent tasks with a strict 45ms timeout limit
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(self.agents)) as executor:
            futures = {executor.submit(agent.evaluate, payload): agent for agent in self.agents}
            
            for future in concurrent.futures.as_completed(futures, timeout=0.045):
                agent = futures[future]
                try:
                    res = future.result()
                    agent_breakdown[agent.name()] = res
                    composite_risk += res["risk_contribution"]
                except concurrent.futures.TimeoutError:
                    # Timeout occurred - apply baseline safety fallback
                    agent_breakdown[agent.name()] = {
                        "risk_contribution": 0.25,
                        "status": "TIMEOUT",
                        "flags": ["ERR_AGENT_TIMEOUT"]
                    }
                    composite_risk += 0.25
                except Exception as e:
                    agent_breakdown[agent.name()] = {
                        "risk_contribution": 0.25,
                        "status": "ERROR",
                        "flags": [f"ERR_AGENT_EXCEPTION: {str(e)}"]
                    }
                    composite_risk += 0.25

        if composite_risk > 1.0:
            composite_risk = 1.0

        execution_time_ms = int((time.time() - start_time) * 1000)

        # Default classification matrix
        if composite_risk >= 0.75:
            verdict = "REJECT"
            remediation = {
                "action_required": "BLOCK_AND_LOCK_CHANNEL",
                "reason_code": "ERR_SECURITY_COOLOFF_BREACH_HIGH_MULE_PROBABILITY",
                "user_display_message": "Transaction declined. Your profile is restricted for 24 hours under regulatory security guidelines."
            }
        elif composite_risk >= 0.40:
            verdict = "CHALLENGE"
            remediation = {
                "action_required": "MFA_STEP_UP",
                "challenge_mechanism": "HARDWARE_PUSH_BIOMETRIC",
                "reason_code": "ERR_BEHAVIORAL_DEVIATION_DETECTION",
                "user_display_message": "Verification required. Please confirm identity using biometric security to complete authorization."
            }
        else:
            verdict = "APPROVE"
            remediation = {
                "action_required": "ALLOW_DIRECT",
                "reason_code": "SYSTEM_HEALTHY_EVALUATION",
                "user_display_message": "Transaction authorized successfully."
            }

        # Override if Velocity agent triggered cooling breach
        vel_res = agent_breakdown.get("velocity_agent", {})
        if vel_res.get("status") == "BREACH" and "ERR_CBN_2026_COOLOFF_ACCUMULATED_OUTFLOW_EXCEEDED" in vel_res.get("flags", []):
            verdict = "REJECT"
            composite_risk = 1.00
            remediation = {
                "action_required": "BLOCK_AND_LOCK_CHANNEL",
                "reason_code": "ERR_CBN_2026_COOLOFF_ACCUMULATED_OUTFLOW_EXCEEDED",
                "user_display_message": "Transaction declined. Outflow limit of NGN 20,000 exceeded for this new device profile."
            }

        return {
            "transaction_id": payload.get("transaction_id", "tx_unknown"),
            "verdict": verdict,
            "composite_risk_score": round(composite_risk, 2),
            "execution_time_ms": execution_time_ms,
            "agent_breakdown": agent_breakdown,
            "remediation": remediation
        }

# 3. HTTP Server Handler
class FraudHTTPHandler(BaseHTTPRequestHandler):
    orchestrator = FraudOrchestrator()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "online",
            "message": "Project E-Vigil Python Backend is active. Send POST requests to /api/v1/fraud/evaluate to process transactions."
        }).encode("utf-8"))

    def do_POST(self):
        if self.path == "/api/v1/fraud/evaluate":
            content_length = int(self.headers["Content-Length"])
            body = self.rfile.read(content_length)
            
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception as e:
                self.send_error(400, f"Invalid JSON payload: {str(e)}")
                return

            result = self.orchestrator.process_transaction(payload)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
        else:
            self.send_error(404, "Endpoint not found")

def run(port=None):
    if port is None:
        port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("0.0.0.0", port), FraudHTTPHandler)
    print(f"[INFO] E-Vigil Python Fallback Backend running on port {port}...")
    print(f"[INFO] REST API Endpoint: POST http://localhost:{port}/api/v1/fraud/evaluate")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    print("[INFO] Server stopped.")

if __name__ == "__main__":
    run()
