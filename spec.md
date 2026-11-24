# Purpose
A web app that simulates evacuating a venue modeled on Madison Square Garden. For engineering students and safety or construction managers. Shows total evacuation time and the 50% and 90% times.

# Inputs
Floor plan editor (walls, exits with widths, obstacles such as seat rows), number of people (100–2,000), crowd placement (random or a region the user draws), walking speed.

# Calculations
Each person walks toward the nearest exit. People slow down and queue when it is crowded. Door flow is limited to about 24 people/min per foot of door width (SFPE Handbook).

# Outputs
Animation, total evacuation time, time to 50% and 90% out, plot of people remaining vs. time.

# Look and feel
Floor plan on the left, controls and results on the right. Must work on a phone.

# Validation
500 people, one 6 ft door. Max flow = 24 × 6 = 144 people/min, so 500/144 ≈ 3.47 min ≈ 208 s. The app should be close

# Out of scope
Fire or smoke spread, stairs, panic behavior, multi-floor buildings.
