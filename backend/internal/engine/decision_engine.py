import numpy as np

class DecisionEngineWrapper:
    def __init__(self, model_path: str = None):
        # In a real scenario we'd use:
        # import onnxruntime as ort
        # self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        self.cbn_cooloff_limit = 20000.00
        self.model_path = model_path

    def evaluate_risk(self, payload: dict, rolling_24h_spend: float) -> dict:
        amount = payload.get("payment_details", {}).get("amount_ngn", 0)
        days_since_device_bind = payload.get("source_account", {}).get("days_since_reactivation", 999)
        
        # 1. Hard Structural Constraint: Real-Time 2026 CBN Regulation Check
        if days_since_device_bind <= 1:
            if (rolling_24h_spend + amount) > self.cbn_cooloff_limit:
                return {
                    "verdict": "REJECT",
                    "composite_risk_score": 1.00,
                    "reason_code": "ERR_CBN_2026_COOLOFF_ACCUMULATED_OUTFLOW_EXCEEDED"
                }

        # 2. Extract Vector Data for Model Processing
        # Vector contains: keystroke cadence deviation, structural hops, account tier, location delta
        behavioral = payload.get("behavioral_telemetry", {})
        source_acc = payload.get("source_account", {})
        
        input_vector = np.array([[
            behavioral.get("keystroke_dwell_time_avg_ms", 0),
            behavioral.get("flight_time_avg_ms", 0),
            1.0 if behavioral.get("input_method") == "PASTED_FROM_CLIPBOARD" else 0.0,
            source_acc.get("current_balance_ngn", 0),
            amount
        ]], dtype=np.float32)

        # Mock ML Model Prediction
        # raw_prediction = self.session.run(None, {self.session.get_inputs()[0].name: input_vector})[0][0][0]
        # Using a simplistic mock logic for demonstration
        raw_prediction = 0.2
        if amount > 150000:
            raw_prediction += 0.3
        if behavioral.get("input_method") == "PASTED_FROM_CLIPBOARD":
            raw_prediction += 0.4

        # 3. Compile Tiered Verdict Matrix
        if raw_prediction >= 0.75:
            verdict = "REJECT"
        elif raw_prediction >= 0.40:
            verdict = "CHALLENGE"
        else:
            verdict = "APPROVE"

        return {
            "verdict": verdict,
            "composite_risk_score": float(raw_prediction),
            "reason_code": "MODEL_INFERENCE_COMPLETE" if verdict != "CHALLENGE" else "ERR_BEHAVIORAL_DEVIATION_DETECTION"
        }
