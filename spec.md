# Purpose
A web app that simulates evacuating a venue modeled on Madison Square Garden. For engineering students and safety or construction managers. Users can compare plans and occupancy scenarios to estimate how quickly people exit, identify the shortest or longest evacuation route, and see total evacuation time and the 50% and 90% times.

# Inputs
Floor plan editor (walls, exits with widths, obstacles such as seat rows), number of people (100–2,000), crowd placement (random or a region the user draws), average walking speed.

- Floor-plan width: ft, 20–500 ft, default 200 ft, number box.
- Floor-plan length: ft, 20–500 ft, default 200 ft, number box.
- Number of people: people, 100–2,000 people, default 500, slider and number box.
- Average walking speed: ft/s, 1–8 ft/s, default 4 ft/s, slider.
- Exit width: ft, 1–20 ft, default 6 ft, number box.
- Seat-row or obstacle dimensions: ft, floor-plan editor.
- Crowd placement: random or a region the user draws, with random placement as the default.
- Random seed: integer, 0 or 1–2,147,483,647, default 1, optional number box.
- Animation speed: multiples of real time, 0.25–8x, default 1x, slider.

# Calculations
Each person walks toward the fastest exit, generally the nearest door, at the average walking speed. A person pauses when they need to let someone pass. People slow down and queue when it is crowded. Door flow is limited to about 24 people/min per foot of door width (SFPE Handbook).

Person routes use the shortest clear path around walls and obstacles. Crowd slowing uses local crowd density to reduce walking speed continuously. Queuing is first-in, first-out with a door capacity of 24 people/min per foot of door width.

# Madison Square Garden layout
Use a simplified representative layout based on Madison Square Garden:

- Bowl shape: approximately 425 ft across for the circular exterior, with a radius of approximately 212.5 ft, and approximately 404 ft across for the structural roof, with a radius of approximately 202 ft.
- Seating sections: pie-shaped sections around the bowl, using the following tier section counts: 100 level, sections 101–120, 20 sections; 200 level, sections 201–227, 27 sections; 300 level, sections 301–328, 28 sections; 400 level, sections 413–420, 8 sections.
- Concourse: a circular hall around the seating bowl. Estimate the lower and upper concourse clear width at 40 ft, with seating portal offsets of approximately 20 ft and concourse-to-exit distances of approximately 100 ft.
- Exits: place doors on three sides of the circular hall and treat each exterior public exit as a 6 ft-wide double door.
- Vertical access: for the simplified layout, place representative escalator or elevator towers near the north, east, south, and west concourse approaches and use 6 ft-wide access openings.
- The simplified seating section counts represent section numbers, not seat counts.
- All layout measurements beyond the 425 ft exterior and 404 ft roof widths are modeling assumptions and should be labeled approximate.

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

When the app first opens, show a ready floor-plan canvas with a default 500-person, one 6 ft exterior-door validation scenario, the proposed average walking speed, results as em dashes until Run is pressed, and a prominent Run evacuation button. Indicate that the displayed floor plan is a model, not an approved life-safety layout.

Floor-plan editor tools: select/move, wall, exterior door, interior obstacle, crowd placement region, erase/delete, undo, redo, pan, zoom, and grid snapping.

# Validation
500 people, one 6 ft door. Max flow = 24 × 6 = 144 people/min, so 500/144 ≈ 3.47 min ≈ 208 s. The app should be close

# Out of scope
Fire or smoke spread, stairs, panic behavior, multi-floor buildings.
