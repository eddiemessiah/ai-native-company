import { GateDoors } from "./gate-doors";

// Runs while the page is parsed: a visitor sees the gate open once per session, never with reduced motion.
const script = `try{var d=document.documentElement;if(sessionStorage.getItem("t-gate")||matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.gate="seen"}else{sessionStorage.setItem("t-gate","1")}}catch(e){document.documentElement.dataset.gate="seen"}`;

/** The temple gate: two doors that open on the first visit of a session. Pure CSS; script only skips it. */
export function GateIntro() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <GateDoors />
    </>
  );
}
