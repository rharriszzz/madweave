#version 3.7;
global_settings { assumed_gamma 1 }
background { color rgb 1 }
camera { orthographic location <16.8374582405,11.2249721603,14.0312152004> look_at 0 sky z right x*15.15371241643446 up y*15.15371241643446 }
light_source { <-16.8374582405,-22.4499443206,33.674916481> color rgb .8 }
light_source { <22.4499443206,11.2249721603,5.61248608016> color rgb .4 }
#declare Paper = texture { uv_mapping pigment { image_map { png "pattern.png" gamma 2.2 interpolate 2 } } finish { ambient .2 diffuse .8 } };
// F1: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <3.2403703492,3.2403703492,3.2403703492>,<3.2403703492,-3.2403703492,-3.2403703492>,<-3.2403703492,3.2403703492,-3.2403703492> } uv_vectors { 3, <0,1>,<2.5,0.5>,<0.5,-0.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// F2: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-3.2403703492,-3.2403703492,3.2403703492>,<3.2403703492,-3.2403703492,-3.2403703492>,<3.2403703492,3.2403703492,3.2403703492> } uv_vectors { 3, <2,2>,<2.5,0.5>,<0,1> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// F3: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <3.2403703492,3.2403703492,3.2403703492>,<-3.2403703492,3.2403703492,-3.2403703492>,<-3.2403703492,-3.2403703492,3.2403703492> } uv_vectors { 3, <0,1>,<0.5,-0.5>,<-2,0> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// F4: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-3.2403703492,-3.2403703492,3.2403703492>,<-3.2403703492,3.2403703492,-3.2403703492>,<3.2403703492,-3.2403703492,-3.2403703492> } uv_vectors { 3, <3,-1>,<0.5,-0.5>,<2.5,0.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
