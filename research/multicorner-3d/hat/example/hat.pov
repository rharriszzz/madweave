#version 3.7;
global_settings { assumed_gamma 1.0 }
background { color rgb <1,1,1> }
#ifndef(View) #declare View=0; #end
#ifndef(Plain) #declare Plain=0; #end
#declare Paper=texture { uv_mapping pigment { image_map { png "pattern.png" gamma 2.2 interpolate 2 once } } finish { ambient .18 diffuse .82 } };
#if(View=0) #declare Eye=<49.190242935,-49.4256258422,40.8979380895>; #declare Aim=<10.3923048454,6,2.1>; #declare Sky=<0,0,1>; camera { orthographic location <49.190242935,-49.4256258422,40.8979380895> look_at <10.3923048454,6,2.1> sky <0,0,1> right x*46.76537180435969 up y*46.76537180435969 } #end
#if(View=1) #declare Eye=<10.3923048454,6,57.5256258422>; #declare Aim=<10.3923048454,6,2.1>; #declare Sky=<0,1,0>; camera { orthographic location <10.3923048454,6,57.5256258422> look_at <10.3923048454,6,2.1> sky <0,1,0> right x*46.76537180435969 up y*46.76537180435969 } #end
#if(View=2) #declare Eye=<10.3923048454,-49.4256258422,2.1>; #declare Aim=<10.3923048454,6,2.1>; #declare Sky=<0,0,1>; camera { orthographic location <10.3923048454,-49.4256258422,2.1> look_at <10.3923048454,6,2.1> sky <0,0,1> right x*46.76537180435969 up y*46.76537180435969 } #end
#if(View=3) #declare Eye=<38.1051177665,-49.4256258422,-36.6979380895>; #declare Aim=<10.3923048454,6,2.1>; #declare Sky=<0,0,1>; camera { orthographic location <38.1051177665,-49.4256258422,-36.6979380895> look_at <10.3923048454,6,2.1> sky <0,0,1> right x*46.76537180435969 up y*46.76537180435969 } #end
#if(View=4) #declare Eye=<-45.0333209968,-27.2553755053,29.8128129211>; #declare Aim=<10.3923048454,6,2.1>; #declare Sky=<0,0,1>; camera { orthographic location <-45.0333209968,-27.2553755053,29.8128129211> look_at <10.3923048454,6,2.1> sky <0,0,1> right x*46.76537180435969 up y*46.76537180435969 } #end
light_source { <-19.6076951546,-34,72.1> color rgb .65 }
light_source { <50.3923048454,26,32.1> color rgb .25 }
light_source { <10.3923048454,6,-47.9> color rgb .3 }
// T on S0
mesh2 { vertex_vectors { 3, <0,0,6>,<20.7846096908,0,6>,<10.3923048454,18,6> } uv_vectors { 3, <0.225,0.775>,<0.744615242271,0.775>,<0.484807621135,0.325> } face_indices { 1, <0,1,2> }
#if(Plain) texture { pigment { color rgb <0.7,0.83,0.71> } finish { ambient .2 diffuse .8 } } #else texture { Paper } #end double_illuminate }
// W0 on S0
mesh2 { vertex_vectors { 4, <0,0,6>,<20.7846096908,0,6>,<20.7846096908,0,0>,<0,0,0> } uv_vectors { 4, <0.225,0.775>,<0.744615242271,0.775>,<0.744615242271,0.925>,<0.225,0.925> } face_indices { 2, <2,1,0>,<3,2,0> }
#if(Plain) texture { pigment { color rgb <0.65,0.77,0.88> } finish { ambient .2 diffuse .8 } } #else texture { Paper } #end double_illuminate }
// R0 on S1
mesh2 { vertex_vectors { 4, <0,0,0>,<-6.92820323028,-4,0>,<27.7128129211,-4,0>,<20.7846096908,0,0> } uv_vectors { 4, <0.225,0.775>,<0.0517949192431,0.875>,<0.917820323028,0.875>,<0.744615242271,0.775> } face_indices { 2, <0,1,2>,<0,2,3> }
#if(Plain) texture { pigment { color rgb <0.65,0.77,0.88> } finish { ambient .2 diffuse .8 } } #else texture { Paper } #end double_illuminate }
// W1 on S0
mesh2 { vertex_vectors { 4, <20.7846096908,0,6>,<10.3923048454,18,6>,<10.3923048454,18,0>,<20.7846096908,0,0> } uv_vectors { 4, <0.744615242271,0.775>,<0.484807621135,0.325>,<0.614711431703,0.25>,<0.874519052838,0.7> } face_indices { 2, <2,1,0>,<3,2,0> }
#if(Plain) texture { pigment { color rgb <0.84,0.74,0.88> } finish { ambient .2 diffuse .8 } } #else texture { Paper } #end double_illuminate }
// R1 on S1
mesh2 { vertex_vectors { 4, <20.7846096908,0,0>,<27.7128129211,-4,0>,<10.3923048454,26,0>,<10.3923048454,18,0> } uv_vectors { 4, <0.744615242271,0.775>,<0.917820323028,0.875>,<0.484807621135,0.125>,<0.484807621135,0.325> } face_indices { 2, <0,1,2>,<0,2,3> }
#if(Plain) texture { pigment { color rgb <0.84,0.74,0.88> } finish { ambient .2 diffuse .8 } } #else texture { Paper } #end double_illuminate }
// W2 on S0
mesh2 { vertex_vectors { 4, <10.3923048454,18,6>,<0,0,6>,<0,0,0>,<10.3923048454,18,0> } uv_vectors { 4, <0.484807621135,0.325>,<0.225,0.775>,<0.0950961894323,0.7>,<0.354903810568,0.25> } face_indices { 2, <2,1,0>,<3,2,0> }
#if(Plain) texture { pigment { color rgb <0.9,0.82,0.65> } finish { ambient .2 diffuse .8 } } #else texture { Paper } #end double_illuminate }
// R2 on S1
mesh2 { vertex_vectors { 4, <10.3923048454,18,0>,<10.3923048454,26,0>,<-6.92820323028,-4,0>,<0,0,0> } uv_vectors { 4, <0.484807621135,0.325>,<0.484807621135,0.125>,<0.0517949192431,0.875>,<0.225,0.775> } face_indices { 2, <0,1,2>,<0,2,3> }
#if(Plain) texture { pigment { color rgb <0.9,0.82,0.65> } finish { ambient .2 diffuse .8 } } #else texture { Paper } #end double_illuminate }
#if(Plain)
#declare Forward=vnormalize(Aim-Eye); #declare Right=vnormalize(vcross(Sky,Forward)); #declare Up=vnormalize(vcross(Forward,Right));
#macro Label(Name,Position) text { ttf "timrom.ttf" Name .01,0 pigment { color rgb <.08,.08,.08> } finish { ambient 1 diffuse 0 } scale .9 matrix <Right.x,Right.y,Right.z, Up.x,Up.y,Up.z, -Forward.x,-Forward.y,-Forward.z, 0,0,0> translate Position-Forward*.3 no_shadow } #end
Label("T",<10.3923048454,6,6>)
Label("W0",<10.3923048454,0,3>)
Label("R0",<10.3923048454,-2,0>)
Label("W1",<15.5884572681,9,3>)
Label("R1",<17.3205080757,10,0>)
Label("W2",<5.19615242271,9,3>)
Label("R2",<3.46410161514,10,0>)
Label("A0",<0,0,6>)
Label("A1",<20.7846096908,0,6>)
Label("A2",<10.3923048454,18,6>)
Label("B1",<20.7846096908,0,0>)
Label("B0",<0,0,0>)
Label("O0",<-6.92820323028,-4,0>)
Label("O1",<27.7128129211,-4,0>)
Label("B2",<10.3923048454,18,0>)
Label("O2",<10.3923048454,26,0>)
#end
