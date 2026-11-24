# Prompt Log

## 1
- **Asked:** Create a top-level AGENTS.md containing the request logging instruction, create an empty prompts.md with a heading, and log this request as the first entry.
- **Changed:** Added AGENTS.md and prompts.md with the initial prompt log entry.
- **Worked:** Yes.

## 2
- **Asked:** Create spec.md with the seven headings Purpose, Inputs, Calculations, Outputs, Look and feel, Validation, and Out of scope, filling each with the provided notes.
- **Changed:** Added spec.md with the provided notes and no additional specification text.
- **Worked:** Yes.

## 3
- **Asked:** Commit with the message "first draft of spec".
- **Changed:** Updated the latest commit message to "first draft of spec" and included this prompt log entry.
- **Worked:** Yes.

## 4
- **Asked:** Review spec.md, identify missing user expectations and purpose clarifications, and propose additions without writing code or changing the specification.
- **Changed:** Logged the request in prompts.md; did not modify spec.md or write code.
- **Worked:** Yes.

## 5
- **Asked:** Clarify the purpose, use average walking speed, have people proceed toward the fastest way out and generally choose the nearest door, pause to let others pass, and define out as exiting the building through an exterior door.
- **Changed:** Updated the Purpose, Inputs, Calculations, and Outputs sections of spec.md and logged the request in prompts.md.
- **Worked:** Yes.

## 6
- **Asked:** Identify additional input information and validation behavior, missing calculation details, variables and units, and ask modeling questions for nearest-exit routing, crowd slowing, and door queuing.
- **Changed:** Reviewed the specification and prompted for modeling decisions; did not modify spec.md or write code.
- **Worked:** Yes.

## 7
- **Asked:** Recommend missing outputs, precise evacuation-time definitions, plot behavior, initial page state, responsive layout, and floor-plan editor tools.
- **Changed:** Reviewed spec.md and logged this request in prompts.md; did not modify spec.md or write code.
- **Worked:** Yes.

## 8
- **Asked:** Update spec.md with the agreed inputs, calculations, outputs, initial layout, phone layout, floor-plan editor decisions, and a simplified Madison Square Garden layout without TBD values.
- **Changed:** Expanded spec.md with the agreed controls and output definitions, added an approximate MSG layout using the supplied exterior and roof dimensions and best-estimate concourse, tower, and exit dimensions, and replaced TBD measurements with modeling assumptions.
- **Worked:** Yes.

## 9
- **Asked:** Read spec.md, write a short whole-app overview, suggest a 4–6-stage build plan starting with a page-layout mockup, and define what to check after each stage. Do not write code.
- **Changed:** Reviewed spec.md and recorded this request in prompts.md; did not write code or change the specification.
- **Worked:** Yes.

## 10
- **Asked:** Remove the seating tiers and towers and add stairs between the pie-shaped seating sections that go up toward the doors.
- **Changed:** Removed the tier and tower assumptions from the MSG layout, added stair aisles between seating wedges leading to the concourse and exterior doors, included stair aisles in routes and editor tools, and removed stairs from Out of scope.
- **Worked:** Yes.

## 11
- **Asked:** Set stair speed to three-quarters of normal speed.
- **Changed:** Updated the stair walking speed in spec.md to three-quarters of average level-ground walking speed and logged this request.
- **Worked:** Yes.

## 12
- **Asked:** Commit with message "added overview and stage outlines".
- **Changed:** Committed the pending specification updates and prompt log with the requested message.
- **Worked:** Yes.

## 13
- **Asked:** Build only Stage 1 from the build stages and commit with "stage 1" as the title.
- **Changed:** Added a static responsive page-layout mockup for the simplified evacuation app and committed it as "stage 1"; no simulation logic was added.
- **Worked:** Yes.

## 14
- **Asked:** Add the overview to the top of spec.md and add the stages at the end under "## Build stages".
- **Changed:** Added a concise app overview and a five-stage build plan with checks to spec.md and logged this request.
- **Worked:** Yes.

## 15
- **Asked:** Build Stage 2 only, following the Stage 2 definition in spec.md, and commit it as "stage 2".
- **Changed:** Added a responsive floor-plan editor, scenario controls, and approximate layout validation; simulation behavior remains out of scope.
- **Worked:** Yes.

## 16
- **Asked:** Change the layout to four evenly spaced doors into the hallway and only three exterior doors, on the top, bottom, and left sides.
- **Changed:** Updated the specification and default MSG layout to show four evenly spaced bowl-to-hallway doors and three double-door exterior exits on the top, bottom, and left sides.
- **Worked:** Yes.

## 17
- **Asked:** Run Stage 3 from the build stages.
- **Changed:** Logged the request and received the required modeling choices: linear crowd slowdown to zero, pause on a blocked next movement step until clear, and keep the nearest reachable exit selected at the start.
- **Worked:** Stage 3 implementation is next.

## 18
- **Asked:** Provide the questions I need to answer before Stage 3.
- **Changed:** Asked for the density-speed rule, yielding trigger, and exit reassignment behavior; received the user's selections.
- **Worked:** Yes.
