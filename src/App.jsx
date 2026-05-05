import { useState, useMemo } from "react";

// Brand palette ----------------------------------------------------
const C = {
  bg: "#F1ECE2",        // warm cream
  card: "#FBFAF6",      // softer card
  cardAlt: "#EFEAE0",   // subtle inset
  ink: "#1B1B1A",       // primary text
  inkMute: "#6E6A62",   // labels, hints
  line: "#E2DCCD",      // hairlines
  yellow: "#B8860B",    // primary accent (was green) — DarkGoldenrod
  yellowSoft: "#EFE5BC",// selection tint (was greenSoft)
  yellowDark: "#6B4F00",// big numbers, emphasis (was greenDark)
  orange: "#D87559",    // food-thoughts, fat macro
  blue: "#7AA8C4",      // carbs macro, "genau das" italic
  cream: "#FBF1D5",     // info-block tint
  black: "#0F0F0E",
};

// Cormorant for display italics, system sans for body
function FontLink() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap');
      :root {
        --serif: 'Cormorant Garamond', 'EB Garamond', Georgia, serif;
        --sans: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, system-ui, sans-serif;
      }
      .serif { font-family: var(--serif); font-weight: 500; letter-spacing: -0.01em; }
      .sans  { font-family: var(--sans); }
      input[type="range"]{
        -webkit-appearance:none; appearance:none; width:100%; height:4px;
        background:${C.line}; border-radius:9999px; outline:none;
      }
      input[type="range"]::-webkit-slider-thumb{
        -webkit-appearance:none; appearance:none; width:22px; height:22px;
        border-radius:9999px; background:${C.yellow};
        box-shadow:0 0 0 6px rgba(184,134,11,0.18);
        cursor:pointer; border:none;
      }
      input[type="range"]::-moz-range-thumb{
        width:22px; height:22px; border-radius:9999px; background:${C.yellow};
        box-shadow:0 0 0 6px rgba(184,134,11,0.18); cursor:pointer; border:none;
      }
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
      input[type="number"]{ -moz-appearance:textfield; }
      .num-display { font-variant-numeric: tabular-nums; }
    `}</style>
  );
}

// math --------------------------------------------------------------
function compute(s) {
  const w = Number(s.weight) || 0;
  const h = Number(s.height) || 0;
  const a = Number(s.age) || 0;

  const bmr = Math.max(
    0,
    Math.round(10 * w + 6.25 * h - 5 * a + (s.gender === "male" ? 5 : -161))
  );
  const af = 1.2 + s.steps / 30000 + s.strengthDays * 0.03 + s.cardioMin / 1500;
  const tdee = Math.round(bmr * af);

  let pct = 0;
  let strategy = "Erhalt";
  if (s.goal === "diet") {
    const deficits = [-15, -18, -20, -22, -25];
    pct = deficits[s.bfIndex];
    if (s.foodThoughts >= 7 || s.bingeHistory) pct = Math.min(pct + 5, -10);
    strategy = "Diät (Defizit)";
  } else if (s.goal === "bulk") {
    const surpluses = [10, 9, 8, 7, 5];
    pct = surpluses[s.bfIndex];
    strategy = "Lean Bulk (5–10%)";
  }

  const target = Math.max(1000, Math.round(tdee * (1 + pct / 100)));
  const delta = target - tdee;

  const proteinPerKg = s.goal === "diet" ? 2.2 : s.goal === "bulk" ? 1.9 : 1.8;
  const protein = Math.round(w * proteinPerKg);
  const fatKcal = Math.round(target * 0.25);
  const fat = Math.round(fatKcal / 9);
  const proteinKcal = protein * 4;
  const carbsKcal = Math.max(0, target - proteinKcal - fatKcal);
  const carbs = Math.round(carbsKcal / 4);

  return { bmr, tdee, af, pct, strategy, target, delta, protein, fat, carbs };
}

const fmt = (n) =>
  new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(n);

const goalCopy = {
  diet:    { word: "Diät",      article: "Deine", tag: "Defizit",  intro: "Genug Defizit, dass du Fett verlierst. Aber so wenig, dass du es 10–14 Tage durchhältst." },
  maintain:{ word: "Erhalt",    article: "Dein",  tag: "Erhalt",   intro: "Dein Körper bleibt, wie er ist. Ideal für Pause, Recomp oder Diät-Break." },
  bulk:    { word: "Lean Bulk", article: "Dein",  tag: "Aufbau",   intro: "Genug Surplus für Muskeln. Aber nicht so viel, dass du unnötig Körperfett aufbaust." },
};

// =================================================================
export default function App() {
  const [step, setStep] = useState(1);

  const [goal, setGoal] = useState("bulk");
  const [gender, setGender] = useState("female");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bfIndex, setBfIndex] = useState(2);
  const [steps, setSteps] = useState(8000);
  const [strengthDays, setStrengthDays] = useState(3);
  const [cardioMin, setCardioMin] = useState(0);
  const [foodThoughts, setFoodThoughts] = useState(3);
  const [bingeHistory, setBingeHistory] = useState(false);

  const result = useMemo(
    () =>
      compute({
        goal, gender, age, height, weight, bfIndex,
        steps, strengthDays, cardioMin, foodThoughts, bingeHistory,
      }),
    [goal, gender, age, height, weight, bfIndex, steps, strengthDays, cardioMin, foodThoughts, bingeHistory]
  );

  const canSubmit =
    Number(age) > 0 &&
    Number(height) > 0 &&
    Number(weight) > 0;

  return (
    <div className="sans min-h-screen w-full" style={{ background: C.bg, color: C.ink }}>
      <FontLink />
      <div className="mx-auto max-w-[640px] px-5 pt-10 pb-24">
        {/* top bar */}
        <div className="flex items-center justify-between mb-10">
          <span className="serif italic text-[19px]" style={{ color: C.ink }}>
            Daniel Preda
          </span>
          <span className="text-[11px] tracking-[0.18em] uppercase" style={{ color: C.inkMute }}>
            Schritt {step} / 2
          </span>
        </div>

        {step === 1 ? (
          <FormStep
            state={{ goal, gender, age, height, weight, bfIndex, steps, strengthDays, cardioMin, foodThoughts, bingeHistory }}
            set={{ setGoal, setGender, setAge, setHeight, setWeight, setBfIndex, setSteps, setStrengthDays, setCardioMin, setFoodThoughts, setBingeHistory }}
            canSubmit={canSubmit}
            onSubmit={() => setStep(2)}
          />
        ) : (
          <ResultStep
            goal={goal}
            result={result}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}

// =================================================================
// FORM
// =================================================================
function FormStep({ state, set, canSubmit, onSubmit }) {
  const { goal, gender, age, height, weight, bfIndex, steps, strengthDays, cardioMin, foodThoughts, bingeHistory } = state;

  return (
    <>
      <h1 className="serif text-[44px] leading-[1.05] mb-1">
        Daniels <em style={{ color: C.yellow }}>Kalorienrechner</em>
      </h1>
      <p className="serif italic text-[22px] leading-tight mb-6" style={{ color: C.yellow }}>
        wissenschaftlich fundiert
      </p>
      <p className="text-[15px] leading-[1.55] mb-8" style={{ color: C.ink }}>
        Genauer als jede Fitbit oder Apple Watch. Diese Berechnung berücksichtigt deine Beständigkeit — denn das beste Defizit nützt nichts, wenn du es nicht konstant einhalten kannst.
      </p>

      {/* 1 GOAL */}
      <Card label="1 — Was ist dein Ziel?">
        <div className="grid grid-cols-3 gap-2.5 mt-1">
          <GoalTile
            active={goal === "diet"} onClick={() => set.setGoal("diet")}
            icon={<svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 6 L15 6 L10 14 Z" fill="#E1564B"/></svg>}
            title="Diät" sub="Fett verlieren"
          />
          <GoalTile
            active={goal === "maintain"} onClick={() => set.setGoal("maintain")}
            icon={<svg width="22" height="20" viewBox="0 0 22 20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11 3v15M4 8 L18 8M4 8l-2 4h4l-2-4Zm14 0l-2 4h4l-2-4Z"/></svg>}
            title="Erhalt" sub="Recomp / Pause"
          />
          <GoalTile
            active={goal === "bulk"} onClick={() => set.setGoal("bulk")}
            icon={<svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 14 L15 14 L10 6 Z" fill="currentColor"/></svg>}
            title="Aufbau" sub="Muskeln, lean"
          />
        </div>
      </Card>

      {/* 2 BASICS */}
      <Card label="2 — Deine Basics">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl mb-5" style={{ background: C.cardAlt }}>
          <SegBtn active={gender === "female"} onClick={() => set.setGender("female")}>Frau</SegBtn>
          <SegBtn active={gender === "male"} onClick={() => set.setGender("male")}>Mann</SegBtn>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <NumField label="Alter"  unit="Jahre" placeholder="z. B. 30" value={age}    onChange={set.setAge} />
          <NumField label="Größe"  unit="cm"    placeholder="z. B. 168" value={height} onChange={set.setHeight} />
        </div>
        <NumField label="Aktuelles Gewicht" unit="kg" placeholder="z. B. 68" value={weight} onChange={set.setWeight} />
      </Card>

      {/* 3 BF % */}
      <Card label="3 — Dein Körperfettanteil (geschätzt)">
        <p className="text-[14px] leading-snug mb-4" style={{ color: C.ink }}>
          Wähle die Silhouette, die deinem aktuellen Körper am nächsten kommt. Niemand kennt seinen exakten KFA — diese Schätzung reicht für eine ehrliche Berechnung.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {["15–20%", "20–25%", "25–30%", "30–35%", "35–50%"].map((label, i) => (
            <BFTile key={i} index={i} active={bfIndex === i} onClick={() => set.setBfIndex(i)}
              label={label}
              sub={["sehr definiert","athletisch","Mitte","+ Polster","hoch"][i]}
            />
          ))}
        </div>
      </Card>

      {/* 4 NEAT */}
      <Card label="4 — Wie aktiv bist du im Alltag?">
        <p className="text-[14px] leading-snug mb-4" style={{ color: C.ink }}>
          NEAT (Schritte, Bewegung im Alltag) ist der größte Hebel — wichtiger als Cardio.
        </p>
        <BigNumberRow value={fmt(steps)} unit="Schritte / Tag" color={C.yellowDark} />
        <input type="range" min="2000" max="16000" step="500" value={steps}
          onChange={(e) => set.setSteps(Number(e.target.value))} />
        <SliderLabels left="2k Sitzend" mid="8k Aktiv" right="16k Sehr aktiv" />
      </Card>

      {/* 5 STRENGTH */}
      <Card label="5 — Wie oft trainierst du Krafttraining?">
        <div className="flex items-center justify-between gap-1.5 mb-3">
          {[0,1,2,3,4,5,6,7].map((n) => (
            <button key={n}
              onClick={() => set.setStrengthDays(n)}
              className="num-display flex-1 aspect-square rounded-lg text-[15px] font-medium transition"
              style={{
                background: strengthDays === n ? C.black : C.cardAlt,
                color: strengthDays === n ? "#fff" : C.ink,
              }}>
              {n}
            </button>
          ))}
        </div>
        <p className="text-[13px]" style={{ color: C.inkMute }}>
          Tage pro Woche. Cardio (siehe unten) nicht mitzählen.
        </p>
      </Card>

      {/* 5B CARDIO */}
      <Card label="5B — Cardio (optional)">
        <p className="text-[14px] leading-snug mb-4" style={{ color: C.ink }}>
          Klassisches Cardio (Laufen, Rad, Schwimmen, HIIT). Wandern oder Spazieren zählst du oben unter Schritte.
        </p>
        <BigNumberRow value={fmt(cardioMin)} unit="Minuten / Woche" color={C.yellowDark} />
        <input type="range" min="0" max="300" step="15" value={cardioMin}
          onChange={(e) => set.setCardioMin(Number(e.target.value))} />
        <SliderLabels left="0 keins" mid="120 moderat" right="300+ viel" />
      </Card>

      {/* 6 ADHERENCE */}
      <Card label="6 — Beständigkeits-Check">
        <p className="text-[14px] leading-snug mb-5" style={{ color: C.ink }}>
          Hier wird mein Rechner ehrlich. Wenn dein Kopf ständig ums Essen kreist oder du Heißhunger-Geschichte hast, passe ich dein Defizit an. Sonst hältst du es nicht durch.
        </p>
        <div className="h-px mb-5" style={{ background: C.line }} />

        <p className="text-[15px] font-medium mb-3" style={{ color: C.ink }}>
          Wie sehr kreisen deine Gedanken um Essen?
        </p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="serif italic num-display text-[36px] leading-none" style={{ color: C.orange }}>
            {foodThoughts}
          </span>
          <span className="text-[13px]" style={{ color: C.inkMute }}>
            /10 — {foodThoughts <= 3 ? "entspannt" : foodThoughts <= 6 ? "öfter" : "ständig"}
          </span>
        </div>
        <input type="range" min="1" max="10" step="1" value={foodThoughts}
          onChange={(e) => set.setFoodThoughts(Number(e.target.value))} />
        <SliderLabels left="1 entspannt" mid="5 öfter" right="10 ständig" />

        <div className="h-px my-5" style={{ background: C.line }} />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[15px] font-medium mb-1.5" style={{ color: C.ink }}>
              Heißhunger-Historie?
            </p>
            <p className="text-[13px] leading-snug" style={{ color: C.inkMute }}>
              Hattest du in der Vergangenheit Probleme mit Heißhunger oder Binges, wenn das Defizit zu hoch war?
            </p>
          </div>
          <Toggle on={bingeHistory} onChange={() => set.setBingeHistory(!bingeHistory)} />
        </div>
      </Card>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full mt-4 py-4 rounded-2xl text-[16px] font-medium transition"
        style={{
          background: canSubmit ? C.black : "#999",
          color: "#fff",
          opacity: canSubmit ? 1 : 0.5,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        Werte berechnen  →
      </button>
      {!canSubmit && (
        <p className="text-[12px] text-center mt-3" style={{ color: C.inkMute }}>
          Trag erst Alter, Größe und Gewicht ein.
        </p>
      )}
    </>
  );
}

// =================================================================
// RESULT
// =================================================================
function ResultStep({ goal, result, onBack }) {
  const { word, article, intro } = goalCopy[goal];
  const { bmr, tdee, af, pct, strategy, target, delta, protein, fat, carbs } = result;
  const cardBg =
    goal === "diet" ? "#C97A66" :
    goal === "maintain" ? "#5A7CA0" :
    C.yellow;

  const pctLabel =
    goal === "diet" ? `${pct}% Diät` :
    goal === "maintain" ? "Erhalt" :
    `+${pct}% Lean Bulk`;

  return (
    <>
      <h1 className="serif text-[44px] leading-[1.05] mb-3">
        {article} <em style={{ color: C.yellow }}>{word}</em>.
      </h1>
      <p className="text-[15px] leading-[1.55] mb-7" style={{ color: C.ink }}>
        {intro}
      </p>

      {/* big calorie card */}
      <div className="rounded-2xl p-7 mb-4" style={{ background: cardBg, color: "#fff" }}>
        <p className="text-[11px] tracking-[0.18em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>
          {goalCopy[goal].tag} — Tägliche Kalorienzufuhr
        </p>
        <p className="serif num-display text-[80px] leading-none italic font-medium mb-2">
          {fmt(target).replace(",", ".")}
        </p>
        <p className="text-[15px] mb-5" style={{ color: "rgba(255,255,255,0.92)" }}>
          Kalorien pro Tag
        </p>
        <span className="inline-block text-[13px] px-3 py-1.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          {pctLabel}
        </span>
      </div>

      {/* macros */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <h3 className="serif text-[26px] mb-4">Makros</h3>
        <div className="grid grid-cols-3 gap-2.5">
          <MacroCard label="Protein" value={protein} color={C.yellow} />
          <MacroCard label="Fett"    value={fat}     color={C.orange} />
          <MacroCard label="Carbs"   value={carbs}   color={C.blue} />
        </div>
      </div>

      {/* breakdown */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <h3 className="serif text-[26px] mb-4">So setzt sich das zusammen</h3>

        <BreakRow label="Grundumsatz (BMR)"  value={fmt(bmr)}  unit="kcal" />
        <BreakRow label="Gesamtumsatz (TDEE)" value={fmt(tdee)} unit="kcal" />
        <BreakRow
          label={goal === "diet" ? "Diät-Defizit" : goal === "bulk" ? "Lean-Bulk Surplus" : "Erhalt"}
          value={`${pct >= 0 ? "+" : ""}${pct}`} unit="%" last
        />

        <div className="mt-4 p-4 rounded-xl space-y-2 text-[14px]" style={{ background: C.cardAlt }}>
          <Row k="Aktivitäts-Faktor"  v={`×${af.toFixed(2)}`} />
          <Row k={delta >= 0 ? "Surplus über TDEE" : "Defizit unter TDEE"} v={`${delta >= 0 ? "+" : ""}${fmt(delta)} kcal`} />
          <Row k="Strategie" v={strategy} bold />
        </div>
      </div>

      {/* personal note */}
      <div className="rounded-2xl p-6 mb-4 relative overflow-hidden" style={{ background: C.cream, border: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[20px] font-medium"
            style={{ background: "#E8C8A8", color: C.ink }}>
            DP
          </div>
          <h3 className="serif text-[28px] italic">Lies das. Ernsthaft.</h3>
        </div>
        <div className="space-y-3 text-[14.5px] leading-[1.6]" style={{ color: C.ink }}>
          <p>
            Jeder Stoffwechsel ist <strong>einzigartig</strong>. Es gibt Faktoren — Organmasse, adaptive Thermogenese, individuelle Effizienz im Energieverbrauch — die <strong>kein Rechner der Welt</strong> exakt vorhersagen kann. Auch nicht meiner. Keine Smartwatch. Kein Fitbit. Keine Waage mit BIA-Funktion.
          </p>
          <p>
            Diese Werte sind dein <strong>Startpunkt, nicht dein Endziel</strong>.
          </p>
          <p>
            Mein Prinzip: Halte das {goal === "bulk" ? "Surplus" : "Defizit"} <strong>10–14 Tage konsequent</strong> ein. Dann schau in der echten Welt was passiert — Gewicht, Maße, Energie, Hunger, Stimmung. Erst dann passt du an. Das ist akkurater als jeder Algorithmus.
          </p>
          <p>
            Aber das funktioniert nur mit einer Sache: <strong>Beständigkeit</strong>. Ohne Konsistenz ist die Mathematik egal. Wenn du das {goal === "bulk" ? "Surplus" : "Defizit"} dreimal pro Woche überschreitest, hast du keine Daten — nur Frustration.
          </p>
        </div>
      </div>

      {/* coaching CTA */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: C.black, color: "#fff" }}>
        <h3 className="serif text-[26px] leading-tight mb-3">
          Wenn dir <em style={{ color: C.blue }}>genau das</em> schwerfällt — bist du nicht allein.
        </h3>
        <p className="text-[14.5px] leading-[1.6] mb-5" style={{ color: "rgba(255,255,255,0.85)" }}>
          Beständigkeit ist keine Willens-Frage. Es ist ein System-Problem. Wenn du immer wieder rausfliegst, in Heißhunger landest, oder einfach nicht weißt wie du das in deinen Alltag integrierst — dafür ist mein Coaching da.
        </p>
        <a href="https://www.daniel-preda.de/" target="_blank" rel="noopener noreferrer"
          className="inline-block px-5 py-3 rounded-xl text-[15px] font-medium no-underline"
          style={{ background: C.blue, color: C.black }}>
          Coaching anschauen  →
        </a>
      </div>

      <button onClick={onBack}
        className="block mx-auto text-[14px] mb-8" style={{ color: C.ink }}>
        ← Nochmal rechnen
      </button>

      <p className="text-[11.5px] text-center leading-relaxed" style={{ color: C.inkMute }}>
        Berechnung basiert auf der Mifflin–St Jeor Formel + Adhärenz-Anpassung nach Daniel Preda.
        <br />
        Keine medizinische Beratung. Bei gesundheitlichen Anliegen sprich mit einem Arzt.
      </p>
    </>
  );
}

// =================================================================
// PRIMITIVES
// =================================================================
function Card({ label, children }) {
  return (
    <div className="rounded-2xl p-6 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <p className="text-[11px] tracking-[0.18em] uppercase mb-4" style={{ color: C.inkMute }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function GoalTile({ active, onClick, icon, title, sub }) {
  return (
    <button onClick={onClick}
      className="rounded-xl py-5 px-2 flex flex-col items-center justify-center gap-2 transition"
      style={{
        background: active ? C.black : C.cardAlt,
        color: active ? "#fff" : C.ink,
      }}>
      <div style={{ color: active ? "#fff" : C.ink }}>{icon}</div>
      <div className="text-[15px] font-medium leading-none mt-1">{title}</div>
      <div className="text-[11.5px] leading-none" style={{ color: active ? "rgba(255,255,255,0.7)" : C.inkMute }}>
        {sub}
      </div>
    </button>
  );
}

function SegBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className="py-3 rounded-lg text-[15px] font-medium transition"
      style={{
        background: active ? C.black : "transparent",
        color: active ? "#fff" : C.ink,
      }}>
      {children}
    </button>
  );
}

function NumField({ label, unit, placeholder, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-[11px] tracking-[0.18em] uppercase mb-2" style={{ color: C.inkMute }}>
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3.5 pr-12 rounded-xl text-[15px] outline-none num-display"
          style={{ background: C.cardAlt, color: C.ink, border: "1px solid transparent" }}
          onFocus={(e) => (e.target.style.border = `1px solid ${C.yellow}`)}
          onBlur={(e) => (e.target.style.border = "1px solid transparent")}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.inkMute }}>
          {unit}
        </span>
      </div>
    </label>
  );
}

function BFTile({ index, active, onClick, label, sub }) {
  const widths = [22, 26, 32, 38, 44];
  const w = widths[index];
  return (
    <button onClick={onClick}
      className="rounded-xl py-3 px-1 flex flex-col items-center transition"
      style={{
        background: active ? C.yellowSoft : C.cardAlt,
        outline: active ? `1.5px solid ${C.yellow}` : "none",
      }}>
      <svg width="50" height="56" viewBox="0 0 50 56" className="mb-2">
        <circle cx="25" cy="10" r="6" fill={active ? C.yellow : "#3F3D38"} />
        <path
          d={`M ${25 - w/2} 22 Q ${25 - w/2 - 2} 38 ${25 - w/2 + 4} 52 L ${25 + w/2 - 4} 52 Q ${25 + w/2 + 2} 38 ${25 + w/2} 22 Q 25 18 ${25 - w/2} 22 Z`}
          fill={active ? C.yellow : "#3F3D38"}
        />
      </svg>
      <div className="num-display text-[12px] font-semibold leading-none mb-1" style={{ color: C.ink }}>
        {label}
      </div>
      <div className="text-[10px] leading-none text-center" style={{ color: C.inkMute }}>
        {sub}
      </div>
    </button>
  );
}

function BigNumberRow({ value, unit, color }) {
  return (
    <div className="flex items-baseline gap-3 mb-3">
      <span className="serif italic num-display text-[40px] leading-none" style={{ color }}>
        {value}
      </span>
      <span className="text-[13px]" style={{ color: C.inkMute }}>
        {unit}
      </span>
    </div>
  );
}

function SliderLabels({ left, mid, right }) {
  return (
    <div className="flex justify-between text-[11.5px] mt-3" style={{ color: C.inkMute }}>
      <span>{left}</span>
      <span>{mid}</span>
      <span>{right}</span>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange}
      className="relative shrink-0 rounded-full transition"
      style={{
        width: 50, height: 28,
        background: on ? C.yellow : "#CFC9BB",
      }}>
      <span className="absolute top-1 rounded-full bg-white transition-all"
        style={{ width: 20, height: 20, left: on ? 26 : 4 }} />
    </button>
  );
}

function MacroCard({ label, value, color }) {
  return (
    <div className="rounded-xl py-4 px-2 text-center" style={{ background: C.cardAlt }}>
      <div className="text-[10.5px] tracking-[0.18em] uppercase mb-2" style={{ color: C.inkMute }}>
        {label}
      </div>
      <div className="serif italic num-display text-[32px] leading-none mb-1.5" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px]" style={{ color: C.inkMute }}>g</div>
    </div>
  );
}

function BreakRow({ label, value, unit, last }) {
  return (
    <>
      <div className="flex items-baseline justify-between py-3">
        <span className="text-[15px]" style={{ color: C.ink }}>{label}</span>
        <span className="text-[15px]">
          <span className="serif italic num-display text-[22px]" style={{ color: C.ink }}>
            {value}
          </span>
          <span className="text-[12px] ml-1" style={{ color: C.inkMute }}>{unit}</span>
        </span>
      </div>
      {!last && <div className="h-px" style={{ background: C.line }} />}
    </>
  );
}

function Row({ k, v, bold }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: C.ink }}>{k}</span>
      <span style={{ color: C.ink, fontWeight: bold ? 600 : 400 }}>{v}</span>
    </div>
  );
}
