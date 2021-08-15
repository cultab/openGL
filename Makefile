one:
	ln -sf ./webgl_1-4.html index.html

two:
	ln -sf ./webgl_5-7.html index.html

three:
	ln -sf ./webgl_8-9.html index.html

final:
	ln -sf ./webgl_final.html index.html

server:
	python3 -m http.server 8000

submit:
	cp report.pdf 171014_Εργασία.pdf
	zip Κατσανδρής_171014.zip ./Makefile ./171014_Εργασία.pdf ./webgl* ./gl-matrix-min.js ./webgl-debug.js ./dark-wood.jpg ./orange-wood.jpg ./knit2.jpg ./light-wood1.jpg ./sky.jpg ./light-wood3.jpg ./favicon.ico

render:
	R --quiet -e "require(rmarkdown);render('report.rmd');"

deploy:
	mkdir -p openGL
	cp *.js *.html *.jpg *.ico openGL/

undeploy:
	rm -rf openGL/


.PHONY: render one two three final
