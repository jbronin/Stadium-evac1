# Overview
A responsive web app for students and safety or construction managers to explore a simplified Madison Square Garden evacuation. Users edit a floor plan, set occupancy and average walking speed, then run an animation showing people routing around obstacles, slowing in crowds, and queuing at exterior doors. Results include evacuation milestones, exit usage and bottlenecks, and a people-remaining-over-time plot. The layout is an approximate model, not an approved life-safety plan.

# Purpose
A web app that simulates evacuating a venue modeled on Madison Square Garden. For engineering students and safety or construction managers. Users can compare plans and occupancy scenarios to estimate how quickly people exit, identify the shortest or longest evacuation route, and see total evacuation time and the 50% and 90% times.

# Inputs
Floor plan editor (walls, bowl-to-hallway doors, exterior exits with widths, obstacles such as seat rows), number of people (100–2,000), crowd placement (random or a region the user draws), average walking speed.

- Floor-plan width: ft, 20–500 ft, default 425 ft, number box.
- Floor-plan length: ft, 20–500 ft, default 425 ft, number box.
- Number of people: people, 100–2,000 people, default 500, slider and number box.
- Average walking speed: ft/s, 1–8 ft/s, default 4 ft/s, slider.
- Exit width: ft, 1–20 ft, default 6 ft, number box.
- Seat-row or obstacle dimensions: ft, floor-plan editor.
- Crowd placement: random or a region the user draws, with random placement as the default.
- Random seed: integer, 0 or 1–2,147,483,647, default 1, optional number box.
- Animation speed: multiples of real time, 0.25–8x, default 1x, slider.

# Calculations
Each person walks toward the fastest exit, generally the nearest door, at the average walking speed. A person pauses when they need to let someone pass. People slow down and queue when it is crowded. Door flow is limited to about 24 people/min per foot of door width (SFPE Handbook).

Person routes use the shortest clear path around walls, obstacles, and stair aisles. Crowd slowing uses local crowd density to reduce walking speed continuously. Queuing is first-in, first-out with a door capacity of 24 people/min per foot of door width.

Walking speed on stair aisles is three-quarters of the average level-ground walking speed.

# Madison Square Garden layout
Use a simplified representative layout based on Madison Square Garden:

- Bowl shape: approximately 425 ft across for the circular exterior, with a radius of approximately 212.5 ft, and approximately 404 ft across for the structural roof, with a radius of approximately 202 ft.
- Seating sections: pie-shaped seating wedges arranged around the bowl, without separate seating tiers.
- Stairs: add stair aisles between the seating wedges, leading upward from the seating area toward the circular concourse and its exterior doors.
- Bowl-to-hallway doors: four evenly spaced, approximately 6 ft-wide doorways between the seating bowl and circular hallway.
- Concourse: a single circular hall around the seating bowl. Estimate its clear width at 40 ft, with seating portal offsets of approximately 20 ft and concourse-to-exit distances of approximately 100 ft.
- Exterior exits: exactly three double-door exits on the top, bottom, and left sides of the circular hallway. Model each exterior exit as 6 ft wide.
- All layout measurements beyond the 425 ft exterior and 404 ft roof widths are modeling assumptions and should be labeled approximate.
- Stair aisles are represented as walkable routes toward the concourse; their walking speed uses the stair-speed rule in Calculations.

# Outputs
Animation, total evacuation time, time to 50% and 90% out, plot of people remaining vs. time. A person is out when they leave the building by exiting through an exterior door.

Show current simulation time while running. Show the percentage and count of people evacuated. Show status as ready, running, complete, or invalid. Show exit usage: people evacuated through each exterior door. Show the exit handling the largest queue or bottleneck. Provide reset and replay controls. Show the assumed inputs used for the run. Display seconds and minutes consistently.

- The 50% time is the earliest time when at least \(\lceil 0.50N \rceil\) people have exited, where \(N\) is the total number of people.
- The 90% time is the earliest time when at least \(\lceil 0.90N \rceil\) people have exited.
- Total time is the earliest time when all \(N\) people have exited.
- A person is out after crossing the exterior-door boundary.
- The plot uses elapsed time in seconds or minutes on the x-axis and people remaining inside on the y-axis.
- The plot starts at \(N\) people remaining at time zero and ends at zero at total evacuation time.
- Mark 50% and 90% on the plot.

# Look and feel
On desktop, show the floor plan and editor on the left, controls and results on the right, and the plot below or in the right-side panel.

On a phone, show the floor-plan canvas at the top, the editor toolbar above or below it, Run and Reset buttons directly below the canvas, and inputs and results in stacked cards. The plot spans the full screen width.

When the app first opens, show a ready floor-plan canvas with a default 500-person scenario, four evenly spaced bowl-to-hallway doors, and three 6 ft exterior exits on the top, bottom, and left sides. Use the proposed average walking speed and show results as em dashes until Run is pressed. Indicate that the displayed floor plan is a model, not an approved life-safety layout.

Floor-plan editor tools: select/move, wall, bowl-to-hallway door, exterior door, stair aisle, interior obstacle, crowd placement region, erase/delete, undo, redo, pan, zoom, and grid snapping.

# Validation
500 people, one 6 ft door. Max flow = 24 × 6 = 144 people/min, so 500/144 ≈ 3.47 min ≈ 208 s. The app should be close

# Out of scope
Fire or smoke spread, panic behavior, multi-floor buildings.

## Build stages

### Stage 1: Page-layout mockup
Build a static, responsive mockup with the floor-plan canvas, editor toolbar, scenario controls, Run and Reset buttons, placeholder result cards, plot area, and simplified-model disclaimer.

**Check:** Desktop shows the floor plan beside controls and results. On phones, Run and Reset follow the floor plan, with inputs and results stacked below. Results are placeholders before a simulation runs.

### Stage 2: Floor-plan editor and scenario inputs
Build the editor tools and input controls, and display the simplified MSG layout with approximate measurements labeled.

**Check:** Users can place and edit walls, doors, obstacles, stair aisles, and crowd regions; enter scenario inputs; and get clear feedback for invalid or unreachable layouts. Check touch interaction on phones.

### Stage 3: Evacuation model
Implement shortest clear paths around walls and obstacles, density-based walking-speed reduction, slower stair travel, first-in-first-out door queues, and door flow capacity. Track when each person crosses an exterior-door boundary.

**Check:** Routes avoid blocked areas, queues follow the specified order, door flow respects its width, and people count as evacuated only after crossing an exterior door. Define the density-to-speed and yielding behavior before evaluating results.

### Stage 4: Animation and results
Connect the model to the animation, elapsed-time and evacuation-count indicators, 50%, 90%, and total times, exit usage, bottleneck indicator, and people-remaining plot.

**Check:** Milestones match the first times the specified number of people exits; the plot starts at the initial population and ends at zero; reset and replay behave consistently.

### Stage 5: Validation and responsive polish
Test the 500-person, 6 ft single-door case and representative obstacle, crowd, and multiple-exit scenarios; refine phone and desktop usability.

**Check:** The single-door result is close to the stated 208-second capacity estimate, the same random seed produces repeatable results, and assumptions and the approximate-model disclaimer are clear.
