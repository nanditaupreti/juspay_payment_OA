export default function StepIndicator({ current }) {
    const steps = ["Search", "Passenger Details", "Payment"];
  
    return (
      <div className="step-indicator">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const state =
            stepNum < current ? "done" : stepNum === current ? "active" : "pending";
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className={`step ${state}`}>
                <div className="step-num">
                  {state === "done" ? "✓" : stepNum}
                </div>
                <span>{label}</span>
              </div>
              {i < steps.length - 1 && <div className="step-line" />}
            </div>
          );
        })}
      </div>
    );
  }