package orchestrator

import (
	"context"
	"log"
	"sync"
	"time"
)

// AgentResult defines the response from an individual micro-agent
type AgentResult struct {
	AgentName        string   `json:"agent_name"`
	RiskContribution float64  `json:"risk_contribution"`
	Status           string   `json:"status"`
	Flags            []string `json:"flags"`
	Error            error    `json:"-"`
}

// TransactionPayload maps exactly to Protobuf fields for execution logic
type TransactionPayload struct {
	TransactionID    string             `json:"transaction_id"`
	Channel          string             `json:"channel"`
	Source           SourceAccount      `json:"source_account"`
	Destination      DestinationAccount `json:"destination_account"`
	Amount           float64            `json:"amount_ngn"`
	PaymentReference string             `json:"payment_reference"`
	Device           DeviceContext      `json:"device_context"`
	Behavioral       BehavioralTelemetry `json:"behavioral_telemetry"`
	Rolling24hSpend  float64            `json:"rolling_24h_spend"`
}

type SourceAccount struct {
	AccountNumber          string  `json:"account_number"`
	BankCode               string  `json:"bank_code"`
	AccountTier            string  `json:"account_tier"`
	CurrentBalanceNgn      float64 `json:"current_balance_ngn"`
	DaysSinceReactivation int     `json:"days_since_reactivation"`
}

type DestinationAccount struct {
	AccountNumber       string `json:"account_number"`
	BankCode            string `json:"bank_code"`
	InstitutionType     string `json:"institution_type"`
	AccountNameResolved string `json:"account_name_resolved"`
	DaysSinceCreation   int    `json:"days_since_creation"`
}

type DeviceContext struct {
	DeviceGUID   string `json:"device_guid"`
	IsRooted     bool   `json:"is_rooted"`
	IsEmulator   bool   `json:"is_emulator"`
	HasVPNActive bool   `json:"has_vpn_active"`
}

type BehavioralTelemetry struct {
	KeystrokeDwellTimeAvgMs float64 `json:"keystroke_dwell_time_avg_ms"`
	FlightTimeAvgMs         float64 `json:"flight_time_avg_ms"`
	InputMethod             string  `json:"input_method"`
	TouchPressureNormalized float64 `json:"touch_pressure_normalized"`
}

// MicroAgent defines the interface for our 4 agents
type MicroAgent interface {
	Name() string
	Evaluate(ctx context.Context, payload TransactionPayload) AgentResult
}

// FraudOrchestrator manages the parallel execution of the agents
type FraudOrchestrator struct {
	agents []MicroAgent
}

func NewFraudOrchestrator() *FraudOrchestrator {
	return &FraudOrchestrator{
		agents: []MicroAgent{
			&DeviceAgent{},
			&BehavioralAgent{},
			&VelocityAgent{},
			&GraphAgent{},
		},
	}
}

// EvaluationResult represents the consolidated response
type EvaluationResult struct {
	TransactionID      string                 `json:"transaction_id"`
	Verdict            string                 `json:"verdict"`
	CompositeRiskScore float64                `json:"composite_risk_score"`
	ExecutionTimeMs    int64                  `json:"execution_time_ms"`
	AgentBreakdown     map[string]AgentResult `json:"agent_breakdown"`
	Remediation        RemediationInfo        `json:"remediation"`
}

type RemediationInfo struct {
	ActionRequired     string `json:"action_required"`
	ChallengeMechanism string `json:"challenge_mechanism,omitempty"`
	ReasonCode         string `json:"reason_code"`
	UserDisplayMessage string `json:"user_display_message"`
}

// ProcessTransaction executes all agents concurrently with a strict 45ms timeout
func (o *FraudOrchestrator) ProcessTransaction(payload TransactionPayload) EvaluationResult {
	start := time.Now()

	// 45ms strict deadline context
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Millisecond)
	defer cancel()

	resultsChan := make(chan AgentResult, len(o.agents))
	var wg sync.WaitGroup

	for _, agent := range o.agents {
		wg.Add(1)
		go func(a MicroAgent) {
			defer wg.Done()

			// Channel to execute agent and get response
			agentChan := make(chan AgentResult, 1)
			
			go func() {
				agentChan <- a.Evaluate(ctx, payload)
			}()

			select {
			case res := <-agentChan:
				resultsChan <- res
			case <-ctx.Done():
				// Timeout occurred - execute safety fallback
				resultsChan <- AgentResult{
					AgentName:        a.Name(),
					RiskContribution: 0.25, // default safety penalty
					Status:           "TIMEOUT",
					Flags:            []string{"ERR_AGENT_TIMEOUT"},
					Error:            ctx.Err(),
				}
			}
		}(agent)
	}

	// Wait for goroutines in background and close channel
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	var compositeRisk float64
	agentBreakdown := make(map[string]AgentResult)

	for res := range resultsChan {
		agentBreakdown[res.AgentName] = res
		compositeRisk += res.RiskContribution
		if res.Error != nil {
			log.Printf("[ERR] Agent %s failed: %v", res.AgentName, res.Error)
		}
	}

	// Dynamic normalization cap
	if compositeRisk > 1.0 {
		compositeRisk = 1.0
	}

	executionTime := time.Since(start).Milliseconds()

	// Risk classification matrix
	var verdict string
	var remediation RemediationInfo

	if compositeRisk >= 0.75 {
		verdict = "REJECT"
		remediation = RemediationInfo{
			ActionRequired:     "BLOCK_AND_LOCK_CHANNEL",
			ReasonCode:         "ERR_SECURITY_COOLOFF_BREACH_HIGH_MULE_PROBABILITY",
			UserDisplayMessage: "Transaction declined. Your profile is restricted for 24 hours under regulatory security guidelines.",
		}
	} else if compositeRisk >= 0.40 {
		verdict = "CHALLENGE"
		remediation = RemediationInfo{
			ActionRequired:     "MFA_STEP_UP",
			ChallengeMechanism: "HARDWARE_PUSH_BIOMETRIC",
			ReasonCode:         "ERR_BEHAVIORAL_DEVIATION_DETECTION",
			UserDisplayMessage: "Verification required. Please confirm identity using biometric security to complete authorization.",
		}
	} else {
		verdict = "APPROVE"
		remediation = RemediationInfo{
			ActionRequired:     "ALLOW_DIRECT",
			ReasonCode:         "SYSTEM_HEALTHY_EVALUATION",
			UserDisplayMessage: "Transaction authorized successfully.",
		}
	}

	// Edge-case force override: If velocity agent triggers a cooling limit breach
	if velocityResult, ok := agentBreakdown["velocity_agent"]; ok && velocityResult.Status == "BREACH" {
		for _, f := range velocityResult.Flags {
			if f == "ERR_CBN_2026_COOLOFF_ACCUMULATED_OUTFLOW_EXCEEDED" {
				verdict = "REJECT"
				compositeRisk = 1.00
				remediation = RemediationInfo{
					ActionRequired:     "BLOCK_AND_LOCK_CHANNEL",
					ReasonCode:         "ERR_CBN_2026_COOLOFF_ACCUMULATED_OUTFLOW_EXCEEDED",
					UserDisplayMessage: "Transaction declined. Outflow limit of NGN 20,000 exceeded for this new device profile.",
				}
			}
		}
	}

	return EvaluationResult{
		TransactionID:      payload.TransactionID,
		Verdict:            verdict,
		CompositeRiskScore: compositeRisk,
		ExecutionTimeMs:    executionTime,
		AgentBreakdown:     agentBreakdown,
		Remediation:        remediation,
	}
}
