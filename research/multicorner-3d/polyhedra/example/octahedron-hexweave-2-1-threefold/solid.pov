#version 3.7;
global_settings { assumed_gamma 1 }
background { color rgb 1 }
camera { orthographic location <19.4422220952,12.9614813968,16.201851746> look_at 0 sky z right x*17.497999885701223 up y*17.497999885701223 }
light_source { <-19.4422220952,-25.9229627936,38.8844441904> color rgb .8 }
light_source { <25.9229627936,12.9614813968,6.48074069841> color rgb .4 }
#declare Paper = texture { uv_mapping pigment { image_map { png "pattern.png" gamma 2.2 interpolate 2 } } finish { ambient .2 diffuse .8 } };
// T0: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <0,0,6.48074069841>,<6.48074069841,0,0>,<3.9683091762e-16,6.48074069841,0> } uv_vectors { 3, <0.5,0.833333333333>,<3,0.333333333333>,<1,-0.666666666667> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// D0: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <3.9683091762e-16,6.48074069841,0>,<6.48074069841,0,0>,<0,0,-6.48074069841> } uv_vectors { 3, <1,-0.666666666667>,<3,0.333333333333>,<3.5,-1.16666666667> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// T1: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <0,0,6.48074069841>,<3.9683091762e-16,6.48074069841,0>,<-6.48074069841,7.93661835241e-16,0> } uv_vectors { 3, <0.5,0.833333333333>,<1,-0.666666666667>,<-1.5,-0.166666666667> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// D1: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-6.48074069841,7.93661835241e-16,0>,<3.9683091762e-16,6.48074069841,0>,<0,0,-6.48074069841> } uv_vectors { 3, <-1.5,-0.166666666667>,<1,-0.666666666667>,<-1,-1.66666666667> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// T2: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <0,0,6.48074069841>,<-6.48074069841,7.93661835241e-16,0>,<-1.19049275286e-15,-6.48074069841,0> } uv_vectors { 3, <0.5,0.833333333333>,<-1.5,-0.166666666667>,<-2,1.33333333333> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// D2: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-1.19049275286e-15,-6.48074069841,0>,<-6.48074069841,7.93661835241e-16,0>,<0,0,-6.48074069841> } uv_vectors { 3, <-2,1.33333333333>,<-1.5,-0.166666666667>,<-4,0.333333333333> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// T3: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <0,0,6.48074069841>,<-1.19049275286e-15,-6.48074069841,0>,<6.48074069841,0,0> } uv_vectors { 3, <0.5,0.833333333333>,<-2,1.33333333333>,<-1.28197512426e-16,2.33333333333> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// D3: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <6.48074069841,0,0>,<-1.19049275286e-15,-6.48074069841,0>,<0,0,-6.48074069841> } uv_vectors { 3, <-1.28197512426e-16,2.33333333333>,<-2,1.33333333333>,<-2.5,2.83333333333> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
