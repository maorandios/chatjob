import Script from "next/script";

const LEGACY_POLYFILLS = `
(function(){
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
})();
`;

export function LegacyPolyfills() {
  return (
    <Script id="legacy-polyfills" strategy="beforeInteractive">
      {LEGACY_POLYFILLS}
    </Script>
  );
}
