let bezier_sine_const = 0.512286623256592433;

function BM_Parser(){
	this.buffer = '';
	this._code = '';
	this.event_map = [];
	this.jump_to = [];
	this.bgm_to = [];
	this.image_to = [];
	this.follow_to = [];
	this.unfollow_to = [];
	this.followers = [];
	this._xmin = 0;
	this._xmax = 0;
	this._ymin = 0;
	this._ymax = 1;
	
	this.constructor = function(){
		
	}
	this.apply_macro = function(arg){
		let macro_list = [["(*(up)*)(*(down)*)",""],
			["(*(down)*)(*(up)*)",""],

		];
		if(arg!=undefined) macro_list.push(arg);
		for(let i=0;i<macro_list.length;i++){
			let cnt = this.countSubString(this._code,macro_list[i][0]);
			while(cnt!=0){
				this._code = this._code.replace(macro_list[i][0],macro_list[i][1]);
				cnt = this.countSubString(this._code,macro_list[i][0]);
			}
		}	
	}
	this.get_arg_list = function(bgm,image,follow){
	    let res  = {bgm:[],image:[],follow:[]};
	    for(var bgm of this.bgm_to){
		res.bgm.push(bgm[2]);
	    }
	    for(var image of this.image_to){
		res.image.push(image[2]);
	    }
	    for(var follow of this.follow_to){
		res.follow.push(follow[2]);
	    }

	    return res;
	}
	this.get_event = function(x,y){
		return this.event_map[x-this._xmin][y-this._ymin];
	}
	this.get_arg = function(x,y){
	    let e = this.event_map[x-this._xmin][y-this._ymin];
	    // 0001: 길 0010: 음악 0100: 저항 1000: 점프
	    let roadis = e&1;
	    let bgmis = e&2;
	    let resistis = e&4;
	    let jumpis = e&8;
	    let hodlis = e&16;
	    let imageis = e&32;
	    let followis = e&64;
	    let clearis = e&128;
	    let refis = e&256;
	    let unfollowis = e&512;
	    let cutis = e&1024;
	    let arg = { bgm:null, jump:null, image:null, follow:null,unfollow:null};
	    if(jumpis){
		for(var jump of this.jump_to){
			if(jump[0]==x-this._xmin){
				  if(jump[1]==y-this._ymin){
				       arg.jump = jump[2]+1;
				  }
			 }
		}
	    }
	    if(bgmis){
		console.log(this.bgm_to);
		console.log(x-this._xmin);

		for(var bgm of this.bgm_to){
			if(bgm[0]==x-this._xmin){
				  if(bgm[1]==y-this._ymin){
				       arg.bgm = bgm[2];
				  }
			 }
		}
	    }
	    if(imageis){
		for(var image of this.image_to){
			if(image[0]==x-this._xmin){
				  if(image[1]==y-this._ymin){
				       arg.image = image[2];
				  }
			 }
		}
	    }
	    if(followis){
		for(var follow of this.follow_to){
			if(follow[0]==x-this._xmin){
				  if(follow[1]==y-this._ymin){
				       arg.follow = follow[2];
				  }
			 }
		}
	    }
	    if(unfollowis){
		for(var unfollow of this.unfollow_to){
			if(unfollow[0]==x-this._xmin){
				  if(unfollow[1]==y-this._ymin){
				       arg.unfollow = unfollow[2];
				  }
			 }
		}
	    }
	    return arg;
	}
	this.in_range = function(x,y){
		let nx = x-this._xmin;
		let ny = y-this._ymin;
		if(nx<0) {
			return false;
		}
		if(nx>(this.event_map.length-1)) {
			return false;
		}
		if(ny<0) {
			return false;
		}
		if(ny>(this.event_map[0].length-1)) {
			return false;
		}
		return true;	
	}
	this.parse_code = async function(code){
            this._code = code;
	    let last_op = 0;
	    let last_cl = 0;
	    let opened = false;
	    let text_r ="";
	    this.event_map = [];
	    this.jump_to = [];
	    this.bgm_to = [];
	    this.follow_to = [];
	    this._xmax = 0;
	    this._ymax = 1;    // 중요 !! 0으로 바꾸면 안돌감
	    this._xmin = 0;
	    this._ymin = 0;
	    let dv = {x:1,y:0};
	    let evtmode = 1;
	    let x = 0;
	    let y = 0;
	    let svg_line = 'M '+(-1)+',0 l 1,0 ';
	    let repl = code;
	    repl+="(*(end)*)";
	    let past_step = 0;
	    let step = 0;
	    let stack = [{x:0,y:0,dx:1,dy:0}];
	    return new Promise((resolve)=>{

	    for(var i=0;i<(repl.length-2);i++){
		 if(this.isSubEqual(repl,"(*(",i)){
			if(opened){
				console.log("opened duplicately: "+i);
				continue;
			}
			step = i - last_cl;
			// 저항모드일 경우 베지어 곡선으로 한칸에 반파장씩 사인함수 그리기
			if(evtmode&4){
				this.calculateMapSize(x+(dv.x*step),y+(dv.y*step));
				if(step>0){
					// 홀수는 위로 짝수는 아래로 곡선을 그림
						if(this.event_map[x+dv.x-this._xmin][y+dv.y-this._ymin]&1) console.log("duplicate route error : "+past_step);
						this.event_map[x+dv.x-this._xmin][y+dv.y-this._ymin] = evtmode|8; // 점프 이벤트
						this.jump_to.push([x+dv.x-this._xmin,y+dv.y-this._ymin,past_step]);
						evtmode &=~2; // 브금켜기는 한번만
						let coef = ((x%2)*2)-1;
						var tmp = coef*-1;
						svg_line += 'l '+(dv.x) + ','+(dv.y)+' ';
						// sine wave
						svg_line += 'c '+(dv.x*(0.5)*bezier_sine_const)+' '+(dv.y*(0.5)*bezier_sine_const)+', '+((dv.x*(0.5)*(1-bezier_sine_const))+(dv.y*coef*(0.5)))+' '+((dv.x*coef*(0.5))+(dv.y*(0.5)*(1-bezier_sine_const)))+', '+((dv.x*0.25*2)+(dv.y*(0.5)*coef))+' '+((dv.x*coef*(0.5))+(dv.y*0.25*2))+' ';
						for(let j=2;j<step;j++){
							// sine wave
							svg_line += 's '+((dv.x*(0.25)*4*(1-bezier_sine_const))+(dv.y*tmp))+' '+((dv.x*tmp)+(dv.y*(0.25)*4*(1-bezier_sine_const)))+','+((dv.x*(0.25)*4)+(dv.y*tmp))+' '+((dv.x*tmp)+(dv.y*(0.25)*4))+' ';

							let tx = x+(dv.x*j);
							let ty = y+(dv.y*j);
							if(this.event_map[tx-this._xmin][ty-this._ymin]&1) console.log("duplicate route error : "+(past_step+j));
							this.event_map[tx-this._xmin][ty-this._ymin] = 4;
							tmp*=-1;
						}
						if(this.event_map[x+(dv.x*step)-this._xmin][y+(dv.y*step)-this._ymin]&1) console.log("duplicate route error : "+i);
						this.event_map[x+(dv.x*step)-this._xmin][y+(dv.y*step)-this._ymin] = evtmode;
						this.jump_to.push([x+(dv.x*step)-this._xmin,y+(dv.y*step)-this._ymin,past_step+step-1]);
						// sine wave
						svg_line += 's '+((dv.x*(0.25)*2)+(dv.y*tmp*(0.5)))+' '+((dv.x*tmp*(0.5))+(dv.y*0.25*2))+','+((dv.x*0.25*2)+(dv.y*tmp*(0.5)))+' '+((dv.x*tmp*(0.5))+(dv.y*0.25*2))+' ';
				}
				stack.push({x:x,y:y,dx:dv.x,dy:dv.y});
				x+=dv.x*(step);
				y+=dv.y*(step);

		      }
			else if(evtmode&16){
				this.calculateMapSize(x+(dv.x),y+(dv.y));
				if(step>0){
					if(this.event_map[x+dv.x-this._xmin][y+dv.y-this._ymin]&1) console.log("duplicate route error : "+(past_step+1));
					this.event_map[x+dv.x-this._xmin][y+dv.y-this._ymin] = evtmode|8;
					this.jump_to.push([x+dv.x-this._xmin,y+dv.y-this._ymin,past_step+step-1]);
					evtmode &=~2; // 브금켜기는 한번만
					stack.push({x:x,y:y,dx:dv.x,dy:dv.y});
					x+=dv.x;
					y+=dv.y;
					svg_line += 'l ' + ((dv.x)) +','+((dv.y))+' ';
				}
			}
			else{
			this.calculateMapSize(x+(dv.x*step),y+(dv.y*step));
			if(step>0){
				if(this.event_map[x+dv.x-this._xmin][y+dv.y-this._ymin]&1) console.log("duplicate route error : "+(past_step+1));
				this.event_map[x+dv.x-this._xmin][y+dv.y-this._ymin] = evtmode|8;
				this.jump_to.push([x+dv.x-this._xmin,y+dv.y-this._ymin,past_step]);
				evtmode &=~2; // 브금켜기는 한번만
				for(let j=2;j<step+1;j++){
					let tx = x+(j*dv.x);
					let ty = y+(j*dv.y);
					if(this.event_map[tx-this._xmin][ty-this._ymin]&1) console.log("duplicate route error : "+(past_step+j));
					this.event_map[tx-this._xmin][ty-this._ymin] = evtmode;
				}
				this.jump_to.push([x+(dv.x*step)-this._xmin,y+(dv.y*step)-this._ymin,past_step+step-1]);
				stack.push({x:x,y:y,dx:dv.x,dy:dv.y});
				x+=dv.x*(step);
				y+=dv.y*(step);
				svg_line += 'l ' + ((dv.x*(step))) +','+((dv.y*(step)))+' ';
			}
		      }
		      //이미지, 사운드, 저항, 커패시터, 나선, 워프장치, 스위치, 아이템
			let text_to_add = repl.substring(last_cl,i);
			past_step +=step;
			text_r += text_to_add;
			opened = true;
			last_op = i;
			i= i+2;
		 }
		else if(this.isSubEqual(repl,")*)",i)){
			if(!opened){
				console.log("already closed : "+i);
				continue;
			}
			let last_was_hodl = false;
			if(evtmode&16){
				last_was_hodl = true;
				evtmode&=~16;
			}
			let token = repl.substring(last_op+3,i);
			let tokens = token.split(' ');
			let com = tokens[0];
			let arg = tokens[1];
			if(com=='up'){
				tmp = dv.x;
				dv.x = dv.y;
				dv.y = -tmp;
		      }
		      if(com=='down'){
			tmp = dv.x;
			dv.x = -dv.y;
			dv.y = tmp;
		      }
		      else if(com=='sine'){
			evtmode |= 4;
		      }
		      else if(com=='line'){
			evtmode &= ~4;
		      }
		      else if(com=='hodl'){
			evtmode |=16;
		      }else if(com=='bgmon'){
			this.event_map[x-this._xmin][y-this._ymin] |=2;
			this.bgm_to.push([x-this._xmin,y-this._ymin,arg]);
		      }else if(com=='bgmoff'){
				evtmode &=~2;
			}else if(com=='with'){
                        this.event_map[x-this._xmin][y-this._ymin] |=64;
                        this.follow_to.push([x-this._xmin,y-this._ymin,arg]);
			}else if(com=='without'){
				this.event_map[x-this._xmin][y-this._ymin] |=512;
				this.unfollow_to.push([x-this._xmin,y-this._ymin,arg]);
			}else if(com=='image'){
				this.event_map[x-this._xmin][y-this._ymin] |=32;
				this.image_to.push([x-this._xmin,y-this._ymin,arg]);
			}else if(com=='clear'){

			}else if(com=='ref'){

			}else if(com=='back'){
				let prev = stack.pop()||{dx:dv.x,dy:dv.y,x:x,y:y};
				console.log(prev);
				x = prev.x;
				y = prev.y;
				svg_line += 'M '+x+','+y+' ';
			}
			opened = false;
			i = i+2;
			last_cl = i+1;
		}
	    }
	    if(opened) console.log("not closed : "+last_op);
	    else {
		this.buffer = text_r;
		console.log("valid without error");
	    }

	    resolve(svg_line);

	    }

	    );
	}
	this.calculateMapSize = function(x,y){
		let xmax = Math.max(this._xmax,x+1); // 텍스트가 없을 때도 1의 크기를 가지고있다고 생각
	    let xmin = Math.min(this._xmin,x);
	    let ymax = Math.max(this._ymax,y+1);
	    let ymin = Math.min(this._ymin,y);
	    // 어레이 크기 갱신
	    for(let i=0;i<xmax-this._xmax;i++){
		let na = new Array(ymax-ymin);
		na.fill(0);
		this.event_map.push(na);
	    }
	    for(let i=0;i<this._xmin-xmin;i++){
		let na = new Array(ymax-ymin);
		na.fill(0);
		this.event_map.unshift(na);
	    }
	    for(let t of this.jump_to){
		t[0]+=this._xmin-xmin;
	    }
	    for(let t of this.bgm_to){

		t[0]+=this._xmin-xmin;
	    }
	    for(let t of this.image_to){
		t[0]+=this._xmin-xmin;
	    }
	    for(let t of this.follow_to){
		t[0]+=this._xmin-xmin;
	    }
	
	//    for(let t of this.theme_to){
	//	t[0]+=this._xmin-xmin;
	 //   }
	    for(let i=0;i<ymax-this._ymax;i++){
		for(let j=0;j<xmax-xmin;j++){
			this.event_map[j].push(0);
		}
	    }
	    for(let i=0;i<this._ymin-ymin;i++){
		for(let j=0;j<xmax-xmin;j++){
			this.event_map[j].unshift(0);
		}
	    }
	    for(let t of this.jump_to){
		t[1]+=this._ymin-ymin;
	    }
	    for(let t of this.bgm_to){
		t[1]+=this._ymin-ymin;
	    }
	    for(let t of this.image_to){
		t[1]+=this._ymin-ymin;
	    }
	    for(let t of this.follow_to){
		t[1]+=this._ymin-ymin;
	    }
	    //for(let t of this.theme_to){
	//	t[1]+=this._ymin-ymin;
	  //  }
	    // 최대값 갱신
	    this._xmax = xmax;
	    this._xmin = xmin;
	    this._ymax = ymax;
	    this._ymin = ymin;	
	}
	this.countSubString = function(text,sub){
		var cnt = 0;
	    for(var i=0;i<(text.length-sub.length+1);i++){
		 if(this.isSubEqual(text,sub,i)){
		   cnt++;
		   i= i+sub.length-1;
		 }
	    }
	    return cnt;
	}
	this.isSubEqual = function(text,sub,i){
		for(var j=0;j<sub.length;j++){
		if(text[i+j]!=sub[j]) return false;
	    }
	    return true;
	}
	console.log("??");
	
}

let test2 = new BM_Parser();
console.log(test2);
let res = test2.get_arg_list();
console.log(res);
let res2 = test2.parse_code("");
console.log(res2);

