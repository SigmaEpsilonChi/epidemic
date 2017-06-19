varying vec2 vTextureCoord;

void main(void) {
	vec2 center = vec2(0.5, 0.5);
	float d = distance(center, vTextureCoord);
	// gl_FragColor = vec4(vTextureCoord.x, vTextureCoord.y, 1.0, 1.0);
	// float o = (sign(1.0-d)+1.0)/2.0;
	float o = 1.0-d;
	gl_FragColor = vec4(o, o, o, o);
}