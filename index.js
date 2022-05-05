let svgns = "http://www.w3.org/2000/svg";
let xlinkns = "http://www.w3.org/1999/xlink";

let svg_dim = {w:20, h:8};
let parallax_resolution = 10;

let pre_trans  = null;
let pre_rotate  = null;
let rotate_speed = 0;
let illu_var = 0;
let illu_tmp = 0;

function zxcv(){
	function init(){
		document.getElementById("");
	}
	function update_html_var(){

	}	
};

// html 태그 제어 변수들
let buffer = "";
let _text_code = '';
let _rtext = '로딩중..';
let book_name = null;   // 공부과목
let book_index = 0;
 
//슬라이드관련코드
let svg_transform = 'scale(1 1)rotate(0 0 0)';
let slide_current = 0;
let pivot_buf = 0;
let bgm  = null;
let bgm_name = "";

let svg_viewBox_ = (-svg_dim.w/2)+' '+(-svg_dim.h*3/4)+' '+svg_dim.w+' '+svg_dim.h;
let svg_viewBox_x = (-svg_dim.w/2);
let svg_viewBox_y = (-svg_dim.h*3/4);

let svg_viewBox_main = '';
let svg_viewBox_parallax_left =[];
let svg_viewBox_parallax_right =[];
let svg_viewBox_varallax_left =[];
let svg_viewBox_varallax_right =[];

function Edit(){

  this.aniFrame = function(timestamp){
    if(this.pre_trans==null){
      this.pre_trans =timestamp;
      this.pre_rotate = timestamp;
      requestAnimationFrame((t)=>{this.aniFrame(t);});
      return;
    }
    let rotate_interval = this.rotate_speed*(timestamp - this.pre_rotate);
    if(rotate_interval>10){
        this.rotate_one(1);
        this.pre_rotate = timestamp;
        requestAnimationFrame((t)=>{this.aniFrame(t);});
        return;
    }
    let trans_interval = this.trans_speed*(timestamp - this.pre_trans);
    if(trans_interval>100){
        this.rand = Math.random();
        this.translate_one(this.trans_vector);
        //this.illu_var = this.svg_cx+(this.illu_tmp/3);
        //this.illu_tmp=(++this.illu_tmp)%2;
        this.pre_trans = timestamp;
    }
    console.log(this.pre_trans);
    console.log(illu_var);
    requestAnimationFrame((t)=>{this.aniFrame(t);});
  };


this.set_svg_viewBox= function(str){
	this.svg_viewBox_ = arg;
    let tmp = arg.split(" ");
    let x = parseInt(tmp[0]);
    let y = parseInt(tmp[1]);
    let w = parseInt(tmp[2]);
    let h = parseInt(tmp[3]);
	let len = this.svg_viewBox_parallax_right.length;
    tmp[0] = ""+(x+(w/2));
    tmp[3] = ""+((h/2)/len);
    for(let i=0;i<len;i++){
        tmp[1] = ""+(y+(i*(h/2)/len));
        this.svg_viewBox_parallax_right[i] = tmp.join(" ");
    }
   
    len = this.svg_viewBox_parallax_left.length;
    tmp[0] = ""+(x);
    tmp[2] = ""+(w/2);
    tmp[3] = ""+((h/2)/len);
    for(let i=0;i<len;i++){
        tmp[1] = ""+(y+(i*(h/2)/len));
        this.svg_viewBox_parallax_left[i] = tmp.join(" ");
    }


    len = this.svg_viewBox_varallax_right.length;
    tmp[1] = ""+(y);
    tmp[3] = ""+(h/2);
    tmp[2] = ""+((w/2)/len);
    for(let i=0;i<len;i++){
        tmp[0] = ""+(x+(w/2)+(i*(w/2)/len));
        this.svg_viewBox_varallax_right[i] = tmp.join(" ");
    }
   
    len = this.svg_viewBox_parallax_left.length;
    for(let i=0;i<len;i++){
        tmp[0] = ""+(x+(i*(w/2)/len));
        this.svg_viewBox_varallax_left[i] = tmp.join(" ");
    }

    tmp[0] = ""+x;
    tmp[1] = ""+(y+(h/2));
    tmp[2] = ""+(w);
    tmp[3] = ""+(h/2);
    this.svg_viewBox_main = tmp.join(" ");
};
this.init=function(){
    this.parser = new ParserService(this.http);
    for(let i =0; i<parallax_resolution;i++){
        this.svg_viewBox_parallax_left.push("");
        this.svg_viewBox_parallax_right.push("");

        this.svg_viewBox_varallax_left.push("");
        this.svg_viewBox_varallax_right.push("");
    }

    this.book_name = route.snapshot.queryParams["book"];
    this.book_index = route.snapshot.queryParams["index"]|0;
    console.log(this.book_name);
    if(this.book_name==null){
        return;
    }
    this.http.get('./assets/' + this.book_name+'.json', {
      responseType: 'text'
    }).subscribe((str) => {
        let j = JSON.parse(str);
        this.text_code=j["core"][this.book_index]["contents"];
    }, (err) => {
        this.errorFlag = true;
    });
};

this.updateFollower=function(key, value){
        for(let i =0;i<this.followers.length;i++){
                if(this.followers[i][0]==key){
                        this.followers[i][1] = value;
                        return;
                }
        }
        this.followers.push([key,value]);
  };

this.set_text_code=function(v) {
    this._text_code = v;
    this.parse_code(v);
    this._rtext = "스크롤을 밀어주세요";
    this.svg_viewBox  = ""+(this.svg_viewBox_x)+" "+(this.svg_viewBox_y)+" "+svg_dim.w+" "+svg_dim.h;
  };

this.parse_code=async function(code){
    this.svg_line = await this.parser.parse_code(code);
    let args = this.parser.get_arg_list();

    args.bgm.forEach((name)=>{
        let aud = new Audio();
        aud.src = "../../../assets/audio/"+name+".mp3";
        aud.load();
        this.bgms.set(name,aud);
    });

    args.follow.forEach((name)=>{
        this.updateFollower(name,"hidden");
    });
};
this.apply_macro_buffer=function(arg1,arg2){
        let buf = this.buffer.substring(this.pivot_buf,this.slide_current);
        console.log(buf);
        let cnt = this.countSubString(buf,arg1);
        while(cnt!=0){
                buf = buf.replace(arg1,arg2);
                cnt = this.countSubString(buf,arg1);
        }
        this._rtext = buf;

  };

this.apply_macro=function(){
	console.log("??");
        this.parser.apply_macro();
  };
this.countSubString=function(text,sub){
    var cnt = 0;
    for(var i=0;i<(text.length-sub.length+1);i++){
         if(this.isSubEqual(text,sub,i)){
           cnt++;
           i= i+sub.length-1;
         }
    }
    return cnt;
  };
this.isSubEqual=function(text,sub,i){
    for(var j=0;j<sub.length;j++){
        if(text[i+j]!=sub[j]) return false;
    }
    return true;
  };
this.trans_svg=function(vector,scalar){
        this.trans_speed = scalar;
        this.trans_vector = vector;
        if(this.pre_trans==null) {
                requestAnimationFrame((t)=>{this.aniFrame(t);});
        }
   };
this.translate_one=function(vector){
        let next_loc = {x:this.svg_cx+vector.x,y:this.svg_cy+vector.y};
        if(!this.parser.in_range(next_loc.x,next_loc.y)) return;

        let e = this.parser.get_event(next_loc.x,next_loc.y);
        let arg = this.parser.get_arg(next_loc.x,next_loc.y);
        if((next_loc.x==this.prev_loc.x)&&(next_loc.y==this.prev_loc.y)) this.tenet = !this.tenet;
        let roadis = e&1;
        let bgmis = e&2;
        let resistis = e&4;
        let jumpis = e&8;
        let hodlis = e&16;
        let imageis = e&32;
        let followis = e&64;
        let clearis = e&128;
        let unfollowis = e&512;

        let next_slide = this.slide_current;
        if(this.tenet){
                followis = e&512;;
                unfollowis = e&64;
                let tmp = arg.follow;
                arg.follow = arg.unfollow;
                arg.unfollow = tmp;
        }

        if(clearis) this.pivot_buf = this.slide_current;

        if(followis){
                this.updateFollower(arg.follow,"visible");
        }

        if(unfollowis){
                this.updateFollower(arg.unfollow,"hidden");
        }
	if(roadis){
                this.prev_loc = {x:this.svg_cx,y:this.svg_cy};
                this.svg_cx = next_loc.x;
                this.svg_cy = next_loc.y;
                this.svg_viewBox_x += (vector.x);
                this.svg_viewBox_y += (vector.y);
                this.svg_viewBox = this.svg_viewBox_x+" "+(this.svg_viewBox_y)+' '+svg_dim.w+' '+svg_dim.h;
                if(this.tenet) {next_slide --;}
                else {next_slide++;}
        }
        if(bgmis){
                this.bgm = this.bgms.get(arg.bgm);
                if(this.bgm.paused) {
                        this.bgm.play();
                }
        }
        if(imageis){
        }
        if(jumpis){
                if(arg.jump>this.slide_current) this.tenet = false;
                next_slide = arg.jump;
        }
        this.slide_current = next_slide;
        this._rtext = this.parser.buffer.substring(this.pivot_buf,this.slide_current);
        if(resistis){
                let sc = this.svg_transform.split('scale(');
                let sc2 = sc[1].split(')');
                sc2[0] = "1 1";
                sc[1] = sc2.join(')');
                this.svg_transform = sc.join('scale(');
                this.svg_cr = 0.2;
                this.svg_path_width = 0.2;
                //this.next_bezier_curve(this.svg_cx);
                this.svg_cflag= false;
                this.svg_ccolor = "red";
                return;
        }
  };
this.c_touchmove=async function (e){
        let dummy = {touches:[{pageX:e.touches[0].pageX,pageY:e.touches[0].pageY}]};
        this.c_mousemove(dummy,this.svg_);
  };

this.c_mousemove=async function(e, ele){
        if(this.svg_mflag) return;
        this.svg_mflag = true;
        let pt = ele.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        let loc = pt.matrixTransform(ele.getScreenCTM().inverse());
        if(this.svg_cflag) {

                //mouse_vector : 마우스와 빨강동그라미의 차벡터
                //let mouse_vector={x:loc.x-(this.svg_viewBox_x+10),y:loc.y};

                let mouse_vector = {x:loc.x-this.svg_cx,y:loc.y-this.svg_cy};
                // 차벡터가 이벤트맵의 이벤트를 건드릴 경우 이동 발생
                // 현재 위치의 바로 양옆 이벤트들만 검색 상하좌우

                let magnitude = Math.sqrt((mouse_vector.x*mouse_vector.x)+(mouse_vector.y*mouse_vector.y)); // 벡터 크기

                if(magnitude<0.7) {
                        this.trans_speed = 0;
                        this.svg_mflag = false;
                        return;
                }
                let unit_vector={x:mouse_vector.x/magnitude,y:mouse_vector.y/magnitude};
                unit_vector.x = mouse_vector.x/magnitude;
                unit_vector.y = mouse_vector.y/magnitude; // 유닛 벡터화

                let rad = Math.atan2(unit_vector.y,unit_vector.x);
                let news_angle = Math.round(2*rad/Math.PI)*Math.PI/2;
                let news_vector = {x:Math.round(Math.cos(news_angle)),y:Math.round(Math.sin(news_angle))};
                let news_vector_origin = {x:news_vector.x,y:news_vector.y};

                let tmpx = (news_vector.x*this.svg_dv.x)-(news_vector.y*this.svg_dv.y);
                news_vector.y = (news_vector.x*this.svg_dv.y)+(news_vector.y*this.svg_dv.x);
                news_vector.x = tmpx;
		 let next_loc = {x:this.svg_cx+news_vector_origin.x,y:this.svg_cy+news_vector_origin.y};
                if(this.parser.in_range(next_loc.x,next_loc.y)){
                        let e = this.parser.get_event(next_loc.x,next_loc.y);
                        let roadis = e&1;
                        let jumpis = e&8;
                        if(roadis){
                                this.trans_svg(news_vector_origin,magnitude);
                        }

                }

        }
        this.svg_mflag = false;
  };

this.l_mousedown=function(e,ele){
        let pt = ele.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        let loc = pt.matrixTransform(ele.getScreenCTM().inverse());
        let diff = loc.x-(this.svg_viewBox_x+10);
        if(Math.abs(diff)<=1){
                this.c_mousedown(e);
        }
  };
  this.l_mouseup=function(e,ele){
        this.c_mouseup(e);
  };
  this.c_mousedown=function(e){
        this.svg_cflag = true;
        this.svg_ccolor = "blue";
  }
  this.c_mouseup=function(e){
        this.svg_cflag = false;
        this.svg_ccolor = "red";
        this.trans_speed = 0;
        this.trans_vector = null;
  };
  this.changeTextArea=function(ele){
        ele.focus();
        this.ti = ele.selectionStart;
  };

};
let edit = new Edit();
