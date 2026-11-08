#version 3.7;
global_settings { assumed_gamma 1 }
background { color rgb 1 }
camera { orthographic location <26.1497308566,17.4331539044,21.7914423805> look_at 0 sky z right x*23.53475777095914 up y*23.53475777095914 }
light_source { <-26.1497308566,-34.8663078088,52.2994617132> color rgb .8 }
light_source { <34.8663078088,17.4331539044,8.71657695221> color rgb .4 }
#declare Paper = texture { uv_mapping pigment { image_map { png "pattern.png" gamma 2.2 interpolate 2 } } finish { ambient .2 diffuse .8 } };
// B0: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <6.30737433573,4.58257569496,-3.89817171925>,<2.40920261648,7.41476323046,3.89817171925>,<7.7963434385,0,3.89817171925> } uv_vectors { 3, <0,1>,<2.5,0.5>,<0.5,-0.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// C0: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <2.40920261648,7.41476323046,3.89817171925>,<6.30737433573,4.58257569496,-3.89817171925>,<-2.40920261648,7.41476323046,-3.89817171925> } uv_vectors { 3, <2.5,0.5>,<0,1>,<2,2> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// T0: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <0,0,8.71657695221>,<7.7963434385,0,3.89817171925>,<2.40920261648,7.41476323046,3.89817171925> } uv_vectors { 3, <3,-1>,<0.5,-0.5>,<2.5,0.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// D0: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-2.40920261648,7.41476323046,-3.89817171925>,<6.30737433573,4.58257569496,-3.89817171925>,<0,0,-8.71657695221> } uv_vectors { 3, <2,2>,<0,1>,<-0.5,2.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// B1: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-2.40920261648,7.41476323046,-3.89817171925>,<-6.30737433573,4.58257569496,3.89817171925>,<2.40920261648,7.41476323046,3.89817171925> } uv_vectors { 3, <2,2>,<4.5,1.5>,<2.5,0.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// C1: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-6.30737433573,4.58257569496,3.89817171925>,<-2.40920261648,7.41476323046,-3.89817171925>,<-7.7963434385,9.54776703701e-16,-3.89817171925> } uv_vectors { 3, <4.5,1.5>,<2,2>,<4,3> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// T1: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <0,0,8.71657695221>,<2.40920261648,7.41476323046,3.89817171925>,<-6.30737433573,4.58257569496,3.89817171925> } uv_vectors { 3, <5,0>,<2.5,0.5>,<4.5,1.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// D1: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-7.7963434385,9.54776703701e-16,-3.89817171925>,<-2.40920261648,7.41476323046,-3.89817171925>,<0,0,-8.71657695221> } uv_vectors { 3, <4,3>,<2,2>,<1.5,3.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// B2: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-7.7963434385,9.54776703701e-16,-3.89817171925>,<-6.30737433573,-4.58257569496,3.89817171925>,<-6.30737433573,4.58257569496,3.89817171925> } uv_vectors { 3, <4,3>,<6.5,2.5>,<4.5,1.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// C2: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-6.30737433573,-4.58257569496,3.89817171925>,<-7.7963434385,9.54776703701e-16,-3.89817171925>,<-2.40920261648,-7.41476323046,-3.89817171925> } uv_vectors { 3, <6.5,2.5>,<4,3>,<6,4> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// T2: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <0,0,8.71657695221>,<-6.30737433573,4.58257569496,3.89817171925>,<-6.30737433573,-4.58257569496,3.89817171925> } uv_vectors { 3, <7,1>,<4.5,1.5>,<6.5,2.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// D2: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-2.40920261648,-7.41476323046,-3.89817171925>,<-7.7963434385,9.54776703701e-16,-3.89817171925>,<0,0,-8.71657695221> } uv_vectors { 3, <6,4>,<4,3>,<3.5,4.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// B3: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <-2.40920261648,-7.41476323046,-3.89817171925>,<2.40920261648,-7.41476323046,3.89817171925>,<-6.30737433573,-4.58257569496,3.89817171925> } uv_vectors { 3, <6,4>,<8.5,3.5>,<6.5,2.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// C3: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <2.40920261648,-7.41476323046,3.89817171925>,<-2.40920261648,-7.41476323046,-3.89817171925>,<6.30737433573,-4.58257569496,-3.89817171925> } uv_vectors { 3, <8.5,3.5>,<6,4>,<8,5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// T3: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <0,0,8.71657695221>,<-6.30737433573,-4.58257569496,3.89817171925>,<2.40920261648,-7.41476323046,3.89817171925> } uv_vectors { 3, <9,2>,<6.5,2.5>,<8.5,3.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// D3: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <6.30737433573,-4.58257569496,-3.89817171925>,<-2.40920261648,-7.41476323046,-3.89817171925>,<0,0,-8.71657695221> } uv_vectors { 3, <8,5>,<6,4>,<5.5,5.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// B4: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <6.30737433573,-4.58257569496,-3.89817171925>,<7.7963434385,0,3.89817171925>,<2.40920261648,-7.41476323046,3.89817171925> } uv_vectors { 3, <8,5>,<10.5,4.5>,<8.5,3.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// C4: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <7.7963434385,0,3.89817171925>,<6.30737433573,-4.58257569496,-3.89817171925>,<6.30737433573,4.58257569496,-3.89817171925> } uv_vectors { 3, <10.5,4.5>,<8,5>,<10,6> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// T4: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <0,0,8.71657695221>,<2.40920261648,-7.41476323046,3.89817171925>,<7.7963434385,0,3.89817171925> } uv_vectors { 3, <11,3>,<8.5,3.5>,<10.5,4.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
// D4: original paper coordinates, repeated periodic tile
mesh2 { vertex_vectors { 3, <6.30737433573,4.58257569496,-3.89817171925>,<6.30737433573,-4.58257569496,-3.89817171925>,<0,0,-8.71657695221> } uv_vectors { 3, <10,6>,<8,5>,<7.5,6.5> } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }
