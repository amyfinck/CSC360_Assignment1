Ground Box
The ground box is implemented as a simple cube scaled to be (6x1x6). It is the basis on which all the scene was built.
Therefore, it is the parent of all the other objects in the scene. When it is moved, all the other objects move with it.

Rocks
Both rocks are simple spheres. Rock 2 contains the seaweed.

Seaweed
The seaweed is built on top of the rock 2 coordinate space, meaning when you move rock 2 the seaweed moves with it.
Each seaweed is made up of 10 elipses, and each strand moves in the same fashion. The movement is accomplished with a
cosine wave, with each rotation being applied to each strand of the seaweed going up the strand. This allows the seaweed to
sway back and forth in unison. The wave shape of the seaweed is accomplished by applying a sine wave to each strand, and
incrementing the phase shift value for each portion of the strand. In this way, the seaweed moves back and forth, and it
appears that waves move up each strand of the seaweed.

Fish
The fish is swimming around rock 2, so I built it upon the rock 2 coordinate system. This means when you move rock 2, the
fish moves with it. The fish moves in a circular motion, and bobs up and down by applying a cosine wave to the y coordinates.
Its fins also move in the x direction using another cosine wave.

Diver
The diver has 2 legs, which rotate at the hips and the knees and kick back and forth. It also bobs up and down in the x
and y direction, using cosine and sine waves.

Bubbles
The bubbles originate from the diver's head in groups of a random size. When they are generated, the current location of
the diver's head is stored in an array. The bubbles are then rendered in the ground box coordinate system, and move up
at a constant rate. They are deleted when they reach the top of the ground box. The bubbles also modulate sublerly in the x
and y direction. Since the bubbles are not drawn in the diver's coordinate system, once they are generated they are not
tied to the motion of the diver.

Overall, I was able to accomplish all the requirements for this assignment.