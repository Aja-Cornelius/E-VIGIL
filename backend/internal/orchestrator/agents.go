package orchestrator

import (
	"context"
	"strings"
)

// DeviceAgent evaluates hardware root profile and VPN concurrency
type DeviceAgent struct{}

func (da *DeviceAgent) Name() string { return "device_agent" }

func (da *DeviceAgent) Evaluate(ctx context.Context, payload TransactionPayload) AgentResult {
	var risk float64
	var flags []string

	if payload.Device.IsRooted {
		risk += 0.50
		flags = append(flags, "ERR_DEVICE_INTEGRITY_ROOTED")
	}
	if payload.Device.IsEmulator {
		risk += 0.40
		flags = append(flags, "ERR_DEVICE_EMULATOR_DETECTED")
	}
	if payload.Device.HasVPNActive {
		risk += 0.15
		flags = append(flags, "ERR_VPN_ACTIVE_LOCATION_MASK")
	}

	status := "VERIFIED"
	if risk > 0.40 {
		status = "ANOMALOUS"
	}

	return AgentResult{
		AgentName:        da.Name(),
		RiskContribution: risk,
		Status:           status,
		Flags:            flags,
	}
}

// BehavioralAgent evaluates typing cadence, dwell metrics, and copy-paste inputs
type BehavioralAgent struct{}

func (ba *BehavioralAgent) Name() string { return "behavioral_agent" }

func (ba *BehavioralAgent) Evaluate(ctx context.Context, payload TransactionPayload) AgentResult {
	var risk float64
	var flags []string

	if strings.ToUpper(payload.Behavioral.InputMethod) == "PASTED_FROM_CLIPBOARD" {
		risk += 0.45
		flags = append(flags, "ERR_PASTED_ACCOUNT_FAST_SUBMIT")
	}
	if payload.Behavioral.KeystrokeDwellTimeAvgMs > 150.0 || payload.Behavioral.KeystrokeDwellTimeAvgMs < 40.0 {
		risk += 0.20
		flags = append(flags, "ERR_TYPING_CADENCE_MISMATCH")
	}
	if payload.Behavioral.TouchPressureNormalized < 0.15 || payload.Behavioral.TouchPressureNormalized > 0.85 {
		risk += 0.15
		flags = append(flags, "ERR_PRESSURE_DEVIATION")
	}

	status := "NORMAL"
	if risk > 0.30 {
		status = "SUSPICIOUS"
	}

	return AgentResult{
		AgentName:        ba.Name(),
		RiskContribution: risk,
		Status:           status,
		Flags:            flags,
	}
}

// VelocityAgent evaluates aggregate transfer velocity and regulatory bounds
type VelocityAgent struct{}

func (va *VelocityAgent) Name() string { return "velocity_agent" }

func (va *VelocityAgent) Evaluate(ctx context.Context, payload TransactionPayload) AgentResult {
	var risk float64
	var flags []string

	// Enforce 2026 CBN 24-hour cooling off policy (₦20,000 aggregate cap)
	if payload.Source.DaysSinceReactivation <= 1 {
		projectedOutflow := payload.Rolling24hSpend + payload.Amount
		if projectedOutflow > 20000.00 {
			return AgentResult{
				AgentName:        va.Name(),
				RiskContribution: 1.00,
				Status:           "BREACH",
				Flags:            []string{"ERR_CBN_2026_COOLOFF_ACCUMULATED_OUTFLOW_EXCEEDED"},
			}
		}
	}

	// Dormancy Reactivation Guard
	if payload.Source.DaysSinceReactivation > 180 && payload.Amount > 50000.00 {
		risk += 0.50
		flags = append(flags, "ERR_DORMANT_ACCOUNT_HIGH_VALUE_REACTIVATION")
	}

	status := "NORMAL"
	if risk > 0.40 {
		status = "BREACH"
	}

	return AgentResult{
		AgentName:        va.Name(),
		RiskContribution: risk,
		Status:           status,
		Flags:            flags,
	}
}

// GraphAgent maps instant payment nodes to trace mule networks and circular loops
type GraphAgent struct{}

func (ga *GraphAgent) Name() string { return "graph_mule_agent" }

func (ga *GraphAgent) Evaluate(ctx context.Context, payload TransactionPayload) AgentResult {
	var risk float64
	var flags []string

	// Mock graph detections:
	// A: Farmed Mule Networks (multiple BVNs mapped to same device hardware)
	if strings.Contains(payload.Destination.InstitutionType, "NEOBANK") && payload.Amount > 15000.00 {
		risk += 0.50
		flags = append(flags, "MULE_NETWORK_CLUSTER_TARGET_CONNECTED")
	}

	// B: Layering circular cash-out loops (routing back to source in under 30m)
	if strings.Contains(payload.PaymentReference, "Crypto") || strings.Contains(payload.PaymentReference, "buy") {
		risk += 0.40
		flags = append(flags, "CIRCULAR_TRANSFERS_LAYERING_LOOP")
	}

	status := "NORMAL"
	if risk > 0.40 {
		status = "SUSPICIOUS"
	}

	return AgentResult{
		AgentName:        ga.Name(),
		RiskContribution: risk,
		Status:           status,
		Flags:            flags,
	}
}
