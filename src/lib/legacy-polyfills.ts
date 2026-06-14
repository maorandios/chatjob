/** Inline polyfill snippet — must be ES5-safe (runs synchronously in <head>). */
export const LEGACY_POLYFILL_SCRIPT = `(function(){
  if(typeof Object.hasOwn!=="function"){
    Object.hasOwn=function(o,k){return Object.prototype.hasOwnProperty.call(o,k);};
  }
  if(!Array.prototype.at){
    Array.prototype.at=function(i){
      var n=this.length,r=Number(i)||0,k=r>=0?r:n+r;
      return k<0||k>=n?void 0:this[k];
    };
  }
  if(typeof globalThis.structuredClone!=="function"){
    globalThis.structuredClone=function(v){return JSON.parse(JSON.stringify(v));};
  }
})();`;
