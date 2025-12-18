// // HtmlRenderer.tsx
// import React from 'react';
// import { ScrollView, useWindowDimensions } from 'react-native';
// import RenderHtml from 'react-native-render-html';

// export default function HtmlRenderer() {
//   const { width } = useWindowDimensions();
//   const htmlContent = `
//     <h1>Lesson 1: Numbers</h1>
//     <p>This is your HTML content rendered in Expo!</p>
//   `;

//   return (
//     <ScrollView contentContainerStyle={{ padding: 16 }}>
//       <RenderHtml contentWidth={width} source={{ html: htmlContent }} />
//     </ScrollView>
//   );
// }


import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const katexCss = `
@font-face{font-family:KaTeX_AMS;font-style:normal;font-weight:400;src:url(fonts/KaTeX_AMS-Regular.woff2) format("woff2"),url(fonts/KaTeX_AMS-Regular.woff) format("woff"),url(fonts/KaTeX_AMS-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Caligraphic;font-style:normal;font-weight:700;src:url(fonts/KaTeX_Caligraphic-Bold.woff2) format("woff2"),url(fonts/KaTeX_Caligraphic-Bold.woff) format("woff"),url(fonts/KaTeX_Caligraphic-Bold.ttf) format("truetype")}@font-face{font-family:KaTeX_Caligraphic;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Caligraphic-Regular.woff2) format("woff2"),url(fonts/KaTeX_Caligraphic-Regular.woff) format("woff"),url(fonts/KaTeX_Caligraphic-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Fraktur;font-style:normal;font-weight:700;src:url(fonts/KaTeX_Fraktur-Bold.woff2) format("woff2"),url(fonts/KaTeX_Fraktur-Bold.woff) format("woff"),url(fonts/KaTeX_Fraktur-Bold.ttf) format("truetype")}@font-face{font-family:KaTeX_Fraktur;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Fraktur-Regular.woff2) format("woff2"),url(fonts/KaTeX_Fraktur-Regular.woff) format("woff"),url(fonts/KaTeX_Fraktur-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Main;font-style:normal;font-weight:700;src:url(fonts/KaTeX_Main-Bold.woff2) format("woff2"),url(fonts/KaTeX_Main-Bold.woff) format("woff"),url(fonts/KaTeX_Main-Bold.ttf) format("truetype")}@font-face{font-family:KaTeX_Main;font-style:italic;font-weight:700;src:url(fonts/KaTeX_Main-BoldItalic.woff2) format("woff2"),url(fonts/KaTeX_Main-BoldItalic.woff) format("woff"),url(fonts/KaTeX_Main-BoldItalic.ttf) format("truetype")}@font-face{font-family:KaTeX_Main;font-style:italic;font-weight:400;src:url(fonts/KaTeX_Main-Italic.woff2) format("woff2"),url(fonts/KaTeX_Main-Italic.woff) format("woff"),url(fonts/KaTeX_Main-Italic.ttf) format("truetype")}@font-face{font-family:KaTeX_Main;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Main-Regular.woff2) format("woff2"),url(fonts/KaTeX_Main-Regular.woff) format("woff"),url(fonts/KaTeX_Main-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Math;font-style:italic;font-weight:700;src:url(fonts/KaTeX_Math-BoldItalic.woff2) format("woff2"),url(fonts/KaTeX_Math-BoldItalic.woff) format("woff"),url(fonts/KaTeX_Math-BoldItalic.ttf) format("truetype")}@font-face{font-family:KaTeX_Math;font-style:italic;font-weight:400;src:url(fonts/KaTeX_Math-Italic.woff2) format("woff2"),url(fonts/KaTeX_Math-Italic.woff) format("woff"),url(fonts/KaTeX_Math-Italic.ttf) format("truetype")}@font-face{font-family:"KaTeX_SansSerif";font-style:normal;font-weight:700;src:url(fonts/KaTeX_SansSerif-Bold.woff2) format("woff2"),url(fonts/KaTeX_SansSerif-Bold.woff) format("woff"),url(fonts/KaTeX_SansSerif-Bold.ttf) format("truetype")}@font-face{font-family:"KaTeX_SansSerif";font-style:italic;font-weight:400;src:url(fonts/KaTeX_SansSerif-Italic.woff2) format("woff2"),url(fonts/KaTeX_SansSerif-Italic.woff) format("woff"),url(fonts/KaTeX_SansSerif-Italic.ttf) format("truetype")}@font-face{font-family:"KaTeX_SansSerif";font-style:normal;font-weight:400;src:url(fonts/KaTeX_SansSerif-Regular.woff2) format("woff2"),url(fonts/KaTeX_SansSerif-Regular.woff) format("woff"),url(fonts/KaTeX_SansSerif-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Script;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Script-Regular.woff2) format("woff2"),url(fonts/KaTeX_Script-Regular.woff) format("woff"),url(fonts/KaTeX_Script-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Size1;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Size1-Regular.woff2) format("woff2"),url(fonts/KaTeX_Size1-Regular.woff) format("woff"),url(fonts/KaTeX_Size1-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Size2;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Size2-Regular.woff2) format("woff2"),url(fonts/KaTeX_Size2-Regular.woff) format("woff"),url(fonts/KaTeX_Size2-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Size3;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Size3-Regular.woff2) format("woff2"),url(fonts/KaTeX_Size3-Regular.woff) format("woff"),url(fonts/KaTeX_Size3-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Size4;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Size4-Regular.woff2) format("woff2"),url(fonts/KaTeX_Size4-Regular.woff) format("woff"),url(fonts/KaTeX_Size4-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Typewriter;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Typewriter-Regular.woff2) format("woff2"),url(fonts/KaTeX_Typewriter-Regular.woff) format("woff"),url(fonts/KaTeX_Typewriter-Regular.ttf) format("truetype")}.katex{font:normal 1.21em KaTeX_Main,Times New Roman,serif;line-height:1.2;text-indent:0;text-rendering:auto}.katex *{-ms-high-contrast-adjust:none!important;border-color:currentColor}.katex .katex-version:after{content:"0.16.22"}.katex .katex-mathml{clip:rect(1px,1px,1px,1px);border:0;height:1px;overflow:hidden;padding:0;position:absolute;width:1px}.katex .katex-html>.newline{display:block}.katex .base{position:relative;white-space:nowrap;width:-webkit-min-content;width:-moz-min-content;width:min-content}.katex .base,.katex .strut{display:inline-block}.katex .textbf{font-weight:700}.katex .textit{font-style:italic}.katex .textrm{font-family:KaTeX_Main}.katex .textsf{font-family:KaTeX_SansSerif}.katex .texttt{font-family:KaTeX_Typewriter}.katex .mathnormal{font-family:KaTeX_Math;font-style:italic}.katex .mathit{font-family:KaTeX_Main;font-style:italic}.katex .mathrm{font-style:normal}.katex .mathbf{font-family:KaTeX_Main;font-weight:700}.katex .boldsymbol{font-family:KaTeX_Math;font-style:italic;font-weight:700}.katex .amsrm,.katex .mathbb,.katex .textbb{font-family:KaTeX_AMS}.katex .mathcal{font-family:KaTeX_Caligraphic}.katex .mathfrak,.katex .textfrak{font-family:KaTeX_Fraktur}.katex .mathboldfrak,.katex .textboldfrak{font-family:KaTeX_Fraktur;font-weight:700}.katex .mathtt{font-family:KaTeX_Typewriter}.katex .mathscr,.katex .textscr{font-family:KaTeX_Script}.katex .mathsf,.katex .textsf{font-family:KaTeX_SansSerif}.katex .mathboldsf,.katex .textboldsf{font-family:KaTeX_SansSerif;font-weight:700}.katex .mathitsf,.katex .mathsfit,.katex .textitsf{font-family:KaTeX_SansSerif;font-style:italic}.katex .mainrm{font-family:KaTeX_Main;font-style:normal}.katex .vlist-t{border-collapse:collapse;display:inline-table;table-layout:fixed}.katex .vlist-r{display:table-row}.katex .vlist{display:table-cell;position:relative;vertical-align:bottom}.katex .vlist>span{display:block;height:0;position:relative}.katex .vlist>span>span{display:inline-block}.katex .vlist>span>.pstrut{overflow:hidden;width:0}.katex .vlist-t2{margin-right:-2px}.katex .vlist-s{display:table-cell;font-size:1px;min-width:2px;vertical-align:bottom;width:2px}.katex .vbox{align-items:baseline;display:inline-flex;flex-direction:column}.katex .hbox{width:100%}.katex .hbox,.katex .thinbox{display:inline-flex;flex-direction:row}.katex .thinbox{max-width:0;width:0}.katex .msupsub{text-align:left}.katex .mfrac>span>span{text-align:center}.katex .mfrac .frac-line{border-bottom-style:solid;display:inline-block;width:100%}.katex .hdashline,.katex .hline,.katex .mfrac .frac-line,.katex .overline .overline-line,.katex .rule,.katex .underline .underline-line{min-height:1px}.katex .mspace{display:inline-block}.katex .clap,.katex .llap,.katex .rlap{position:relative;width:0}.katex .clap>.inner,.katex .llap>.inner,.katex .rlap>.inner{position:absolute}.katex .clap>.fix,.katex .llap>.fix,.katex .rlap>.fix{display:inline-block}.katex .llap>.inner{right:0}.katex .clap>.inner,.katex .rlap>.inner{left:0}.katex .clap>.inner>span{margin-left:-50%;margin-right:50%}.katex .rule{border:0 solid;display:inline-block;position:relative}.katex .hline,.katex .overline .overline-line,.katex .underline .underline-line{border-bottom-style:solid;display:inline-block;width:100%}.katex .hdashline{border-bottom-style:dashed;display:inline-block;width:100%}.katex .sqrt>.root{margin-left:.2777777778em;margin-right:-.5555555556em}.katex .fontsize-ensurer.reset-size1.size1,.katex .sizing.reset-size1.size1{font-size:1em}.katex .fontsize-ensurer.reset-size1.size2,.katex .sizing.reset-size1.size2{font-size:1.2em}.katex .fontsize-ensurer.reset-size1.size3,.katex .sizing.reset-size1.size3{font-size:1.4em}.katex .fontsize-ensurer.reset-size1.size4,.katex .sizing.reset-size1.size4{font-size:1.6em}.katex .fontsize-ensurer.reset-size1.size5,.katex .sizing.reset-size1.size5{font-size:1.8em}.katex .fontsize-ensurer.reset-size1.size6,.katex .sizing.reset-size1.size6{font-size:2em}.katex .fontsize-ensurer.reset-size1.size7,.katex .sizing.reset-size1.size7{font-size:2.4em}.katex .fontsize-ensurer.reset-size1.size8,.katex .sizing.reset-size1.size8{font-size:2.88em}.katex .fontsize-ensurer.reset-size1.size9,.katex .sizing.reset-size1.size9{font-size:3.456em}.katex .fontsize-ensurer.reset-size1.size10,.katex .sizing.reset-size1.size10{font-size:4.148em}.katex .fontsize-ensurer.reset-size1.size11,.katex .sizing.reset-size1.size11{font-size:4.976em}.katex .fontsize-ensurer.reset-size2.size1,.katex .sizing.reset-size2.size1{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size2.size2,.katex .sizing.reset-size2.size2{font-size:1em}.katex .fontsize-ensurer.reset-size2.size3,.katex .sizing.reset-size2.size3{font-size:1.1666666667em}.katex .fontsize-ensurer.reset-size2.size4,.katex .sizing.reset-size2.size4{font-size:1.3333333333em}.katex .fontsize-ensurer.reset-size2.size5,.katex .sizing.reset-size2.size5{font-size:1.5em}.katex .fontsize-ensurer.reset-size2.size6,.katex .sizing.reset-size2.size6{font-size:1.6666666667em}.katex .fontsize-ensurer.reset-size2.size7,.katex .sizing.reset-size2.size7{font-size:2em}.katex .fontsize-ensurer.reset-size2.size8,.katex .sizing.reset-size2.size8{font-size:2.4em}.katex .fontsize-ensurer.reset-size2.size9,.katex .sizing.reset-size2.size9{font-size:2.88em}.katex .fontsize-ensurer.reset-size2.size10,.katex .sizing.reset-size2.size10{font-size:3.4566666667em}.katex .fontsize-ensurer.reset-size2.size11,.katex .sizing.reset-size2.size11{font-size:4.1466666667em}.katex .fontsize-ensurer.reset-size3.size1,.katex .sizing.reset-size3.size1{font-size:.7142857143em}.katex .fontsize-ensurer.reset-size3.size2,.katex .sizing.reset-size3.size2{font-size:.8571428571em}.katex .fontsize-ensurer.reset-size3.size3,.katex .sizing.reset-size3.size3{font-size:1em}.katex .fontsize-ensurer.reset-size3.size4,.katex .sizing.reset-size3.size4{font-size:1.1428571429em}.katex .fontsize-ensurer.reset-size3.size5,.katex .sizing.reset-size3.size5{font-size:1.2857142857em}.katex .fontsize-ensurer.reset-size3.size6,.katex .sizing.reset-size3.size6{font-size:1.4285714286em}.katex .fontsize-ensurer.reset-size3.size7,.katex .sizing.reset-size3.size7{font-size:1.7142857143em}.katex .fontsize-ensurer.reset-size3.size8,.katex .sizing.reset-size3.size8{font-size:2.0571428571em}.katex .fontsize-ensurer.reset-size3.size9,.katex .sizing.reset-size3.size9{font-size:2.4685714286em}.katex .fontsize-ensurer.reset-size3.size10,.katex .sizing.reset-size3.size10{font-size:2.9628571429em}.katex .fontsize-ensurer.reset-size3.size11,.katex .sizing.reset-size3.size11{font-size:3.5542857143em}.katex .fontsize-ensurer.reset-size4.size1,.katex .sizing.reset-size4.size1{font-size:.625em}.katex .fontsize-ensurer.reset-size4.size2,.katex .sizing.reset-size4.size2{font-size:.75em}.katex .fontsize-ensurer.reset-size4.size3,.katex .sizing.reset-size4.size3{font-size:.875em}.katex .fontsize-ensurer.reset-size4.size4,.katex .sizing.reset-size4.size4{font-size:1em}.katex .fontsize-ensurer.reset-size4.size5,.katex .sizing.reset-size4.size5{font-size:1.125em}.katex .fontsize-ensurer.reset-size4.size6,.katex .sizing.reset-size4.size6{font-size:1.25em}.katex .fontsize-ensurer.reset-size4.size7,.katex .sizing.reset-size4.size7{font-size:1.5em}.katex .fontsize-ensurer.reset-size4.size8,.katex .sizing.reset-size4.size8{font-size:1.8em}.katex .fontsize-ensurer.reset-size4.size9,.katex .sizing.reset-size4.size9{font-size:2.16em}.katex .fontsize-ensurer.reset-size4.size10,.katex .sizing.reset-size4.size10{font-size:2.5925em}.katex .fontsize-ensurer.reset-size4.size11,.katex .sizing.reset-size4.size11{font-size:3.11em}.katex .fontsize-ensurer.reset-size5.size1,.katex .sizing.reset-size5.size1{font-size:.5555555556em}.katex .fontsize-ensurer.reset-size5.size2,.katex .sizing.reset-size5.size2{font-size:.6666666667em}.katex .fontsize-ensurer.reset-size5.size3,.katex .sizing.reset-size5.size3{font-size:.7777777778em}.katex .fontsize-ensurer.reset-size5.size4,.katex .sizing.reset-size5.size4{font-size:.8888888889em}.katex .fontsize-ensurer.reset-size5.size5,.katex .sizing.reset-size5.size5{font-size:1em}.katex .fontsize-ensurer.reset-size5.size6,.katex .sizing.reset-size5.size6{font-size:1.1111111111em}.katex .fontsize-ensurer.reset-size5.size7,.katex .sizing.reset-size5.size7{font-size:1.3333333333em}.katex .fontsize-ensurer.reset-size5.size8,.katex .sizing.reset-size5.size8{font-size:1.6em}.katex .fontsize-ensurer.reset-size5.size9,.katex .sizing.reset-size5.size9{font-size:1.92em}.katex .fontsize-ensurer.reset-size5.size10,.katex .sizing.reset-size5.size10{font-size:2.3044444444em}.katex .fontsize-ensurer.reset-size5.size11,.katex .sizing.reset-size5.size11{font-size:2.7644444444em}.katex .fontsize-ensurer.reset-size6.size1,.katex .sizing.reset-size6.size1{font-size:.5em}.katex .fontsize-ensurer.reset-size6.size2,.katex .sizing.reset-size6.size2{font-size:.6em}.katex .fontsize-ensurer.reset-size6.size3,.katex .sizing.reset-size6.size3{font-size:.7em}.katex .fontsize-ensurer.reset-size6.size4,.katex .sizing.reset-size6.size4{font-size:.8em}.katex .fontsize-ensurer.reset-size6.size5,.katex .sizing.reset-size6.size5{font-size:.9em}.katex .fontsize-ensurer.reset-size6.size6,.katex .sizing.reset-size6.size6{font-size:1em}.katex .fontsize-ensurer.reset-size6.size7,.katex .sizing.reset-size6.size7{font-size:1.2em}.katex .fontsize-ensurer.reset-size6.size8,.katex .sizing.reset-size6.size8{font-size:1.44em}.katex .fontsize-ensurer.reset-size6.size9,.katex .sizing.reset-size6.size9{font-size:1.728em}.katex .fontsize-ensurer.reset-size6.size10,.katex .sizing.reset-size6.size10{font-size:2.074em}.katex .fontsize-ensurer.reset-size6.size11,.katex .sizing.reset-size6.size11{font-size:2.488em}.katex .fontsize-ensurer.reset-size7.size1,.katex .sizing.reset-size7.size1{font-size:.4166666667em}.katex .fontsize-ensurer.reset-size7.size2,.katex .sizing.reset-size7.size2{font-size:.5em}.katex .fontsize-ensurer.reset-size7.size3,.katex .sizing.reset-size7.size3{font-size:.5833333333em}.katex .fontsize-ensurer.reset-size7.size4,.katex .sizing.reset-size7.size4{font-size:.6666666667em}.katex .fontsize-ensurer.reset-size7.size5,.katex .sizing.reset-size7.size5{font-size:.75em}.katex .fontsize-ensurer.reset-size7.size6,.katex .sizing.reset-size7.size6{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size7.size7,.katex .sizing.reset-size7.size7{font-size:1em}.katex .fontsize-ensurer.reset-size7.size8,.katex .sizing.reset-size7.size8{font-size:1.2em}.katex .fontsize-ensurer.reset-size7.size9,.katex .sizing.reset-size7.size9{font-size:1.44em}.katex .fontsize-ensurer.reset-size7.size10,.katex .sizing.reset-size7.size10{font-size:1.7283333333em}.katex .fontsize-ensurer.reset-size7.size11,.katex .sizing.reset-size7.size11{font-size:2.0733333333em}.katex .fontsize-ensurer.reset-size8.size1,.katex .sizing.reset-size8.size1{font-size:.3472222222em}.katex .fontsize-ensurer.reset-size8.size2,.katex .sizing.reset-size8.size2{font-size:.4166666667em}.katex .fontsize-ensurer.reset-size8.size3,.katex .sizing.reset-size8.size3{font-size:.4861111111em}.katex .fontsize-ensurer.reset-size8.size4,.katex .sizing.reset-size8.size4{font-size:.5555555556em}.katex .fontsize-ensurer.reset-size8.size5,.katex .sizing.reset-size8.size5{font-size:.625em}.katex .fontsize-ensurer.reset-size8.size6,.katex .sizing.reset-size8.size6{font-size:.6944444444em}.katex .fontsize-ensurer.reset-size8.size7,.katex .sizing.reset-size8.size7{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size8.size8,.katex .sizing.reset-size8.size8{font-size:1em}.katex .fontsize-ensurer.reset-size8.size9,.katex .sizing.reset-size8.size9{font-size:1.2em}.katex .fontsize-ensurer.reset-size8.size10,.katex .sizing.reset-size8.size10{font-size:1.4402777778em}.katex .fontsize-ensurer.reset-size8.size11,.katex .sizing.reset-size8.size11{font-size:1.7277777778em}.katex .fontsize-ensurer.reset-size9.size1,.katex .sizing.reset-size9.size1{font-size:.2893518519em}.katex .fontsize-ensurer.reset-size9.size2,.katex .sizing.reset-size9.size2{font-size:.3472222222em}.katex .fontsize-ensurer.reset-size9.size3,.katex .sizing.reset-size9.size3{font-size:.4050925926em}.katex .fontsize-ensurer.reset-size9.size4,.katex .sizing.reset-size9.size4{font-size:.462962963em}.katex .fontsize-ensurer.reset-size9.size5,.katex .sizing.reset-size9.size5{font-size:.5208333333em}.katex .fontsize-ensurer.reset-size9.size6,.katex .sizing.reset-size9.size6{font-size:.5787037037em}.katex .fontsize-ensurer.reset-size9.size7,.katex .sizing.reset-size9.size7{font-size:.6944444444em}.katex .fontsize-ensurer.reset-size9.size8,.katex .sizing.reset-size9.size8{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size9.size9,.katex .sizing.reset-size9.size9{font-size:1em}.katex .fontsize-ensurer.reset-size9.size10,.katex .sizing.reset-size9.size10{font-size:1.2002314815em}.katex .fontsize-ensurer.reset-size9.size11,.katex .sizing.reset-size9.size11{font-size:1.4398148148em}.katex .fontsize-ensurer.reset-size10.size1,.katex .sizing.reset-size10.size1{font-size:.2410800386em}.katex .fontsize-ensurer.reset-size10.size2,.katex .sizing.reset-size10.size2{font-size:.2892960463em}.katex .fontsize-ensurer.reset-size10.size3,.katex .sizing.reset-size10.size3{font-size:.337512054em}.katex .fontsize-ensurer.reset-size10.size4,.katex .sizing.reset-size10.size4{font-size:.3857280617em}.katex .fontsize-ensurer.reset-size10.size5,.katex .sizing.reset-size10.size5{font-size:.4339440694em}.katex .fontsize-ensurer.reset-size10.size6,.katex .sizing.reset-size10.size6{font-size:.4821600771em}.katex .fontsize-ensurer.reset-size10.size7,.katex .sizing.reset-size10.size7{font-size:.5785920926em}.katex .fontsize-ensurer.reset-size10.size8,.katex .sizing.reset-size10.size8{font-size:.6943105111em}.katex .fontsize-ensurer.reset-size10.size9,.katex .sizing.reset-size10.size9{font-size:.8331726133em}.katex .fontsize-ensurer.reset-size10.size10,.katex .sizing.reset-size10.size10{font-size:1em}.katex .fontsize-ensurer.reset-size10.size11,.katex .sizing.reset-size10.size11{font-size:1.1996142719em}.katex .fontsize-ensurer.reset-size11.size1,.katex .sizing.reset-size11.size1{font-size:.2009646302em}.katex .fontsize-ensurer.reset-size11.size2,.katex .sizing.reset-size11.size2{font-size:.2411575563em}.katex .fontsize-ensurer.reset-size11.size3,.katex .sizing.reset-size11.size3{font-size:.2813504823em}.katex .fontsize-ensurer.reset-size11.size4,.katex .sizing.reset-size11.size4{font-size:.3215434084em}.katex .fontsize-ensurer.reset-size11.size5,.katex .sizing.reset-size11.size5{font-size:.3617363344em}.katex .fontsize-ensurer.reset-size11.size6,.katex .sizing.reset-size11.size6{font-size:.4019292605em}.katex .fontsize-ensurer.reset-size11.size7,.katex .sizing.reset-size11.size7{font-size:.4823151125em}.katex .fontsize-ensurer.reset-size11.size8,.katex .sizing.reset-size11.size8{font-size:.578778135em}.katex .fontsize-ensurer.reset-size11.size9,.katex .sizing.reset-size11.size9{font-size:.6945337621em}.katex .fontsize-ensurer.reset-size11.size10,.katex .sizing.reset-size11.size10{font-size:.8336012862em}.katex .fontsize-ensurer.reset-size11.size11,.katex .sizing.reset-size11.size11{font-size:1em}.katex .delimsizing.size1{font-family:KaTeX_Size1}.katex .delimsizing.size2{font-family:KaTeX_Size2}.katex .delimsizing.size3{font-family:KaTeX_Size3}.katex .delimsizing.size4{font-family:KaTeX_Size4}.katex .delimsizing.mult .delim-size1>span{font-family:KaTeX_Size1}.katex .delimsizing.mult .delim-size4>span{font-family:KaTeX_Size4}.katex .nulldelimiter{display:inline-block;width:.12em}.katex .delimcenter,.katex .op-symbol{position:relative}.katex .op-symbol.small-op{font-family:KaTeX_Size1}.katex .op-symbol.large-op{font-family:KaTeX_Size2}.katex .accent>.vlist-t,.katex .op-limits>.vlist-t{text-align:center}.katex .accent .accent-body{position:relative}.katex .accent .accent-body:not(.accent-full){width:0}.katex .overlay{display:block}.katex .mtable .vertical-separator{display:inline-block;min-width:1px}.katex .mtable .arraycolsep{display:inline-block}.katex .mtable .col-align-c>.vlist-t{text-align:center}.katex .mtable .col-align-l>.vlist-t{text-align:left}.katex .mtable .col-align-r>.vlist-t{text-align:right}.katex .svg-align{text-align:left}.katex svg{fill:currentColor;stroke:currentColor;fill-rule:nonzero;fill-opacity:1;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;display:block;height:inherit;position:absolute;width:100%}.katex svg path{stroke:none}.katex img{border-style:none;max-height:none;max-width:none;min-height:0;min-width:0}.katex .stretchy{display:block;overflow:hidden;position:relative;width:100%}.katex .stretchy:after,.katex .stretchy:before{content:""}.katex .hide-tail{overflow:hidden;position:relative;width:100%}.katex .halfarrow-left{left:0;overflow:hidden;position:absolute;width:50.2%}.katex .halfarrow-right{overflow:hidden;position:absolute;right:0;width:50.2%}.katex .brace-left{left:0;overflow:hidden;position:absolute;width:25.1%}.katex .brace-center{left:25%;overflow:hidden;position:absolute;width:50%}.katex .brace-right{overflow:hidden;position:absolute;right:0;width:25.1%}.katex .x-arrow-pad{padding:0 .5em}.katex .cd-arrow-pad{padding:0 .55556em 0 .27778em}.katex .mover,.katex .munder,.katex .x-arrow{text-align:center}.katex .boxpad{padding:0 .3em}.katex .fbox,.katex .fcolorbox{border:.04em solid;box-sizing:border-box}.katex .cancel-pad{padding:0 .2em}.katex .cancel-lap{margin-left:-.2em;margin-right:-.2em}.katex .sout{border-bottom-style:solid;border-bottom-width:.08em}.katex .angl{border-right:.049em solid;border-top:.049em solid;box-sizing:border-box;margin-right:.03889em}.katex .anglpad{padding:0 .03889em}.katex .eqn-num:before{content:"(" counter(katexEqnNo) ")";counter-increment:katexEqnNo}.katex .mml-eqn-num:before{content:"(" counter(mmlEqnNo) ")";counter-increment:mmlEqnNo}.katex .mtr-glue{width:50%}.katex .cd-vert-arrow{display:inline-block;position:relative}.katex .cd-label-left{display:inline-block;position:absolute;right:calc(50% + .3em);text-align:left}.katex .cd-label-right{display:inline-block;left:calc(50% + .3em);position:absolute;text-align:right}.katex-display{display:block;margin:1em 0;text-align:center}.katex-display>.katex{display:block;text-align:center;white-space:nowrap}.katex-display>.katex>.katex-html{display:block;position:relative}.katex-display>.katex>.katex-html>.tag{position:absolute;right:0}.katex-display.leqno>.katex>.katex-html>.tag{left:0;right:auto}.katex-display.fleqn>.katex{padding-left:2em;text-align:left}body{counter-reset:katexEqnNo mmlEqnNo}

`;

export default function HtmlRenderer() {
  const htmlContent = `
  <!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <title>Lesson</title>
  <style>
    body {
      font-family: sans-serif;
      font-size: 50px;
      padding: 16px;
      background: #fff;
    }

    img {
      max-width: 100%;
    }
  </style>
</head>

<body>
  <!--$--><!--/$-->
  <div class="flex flex-row w-full max-w-7xl justify-between gap-6" bis_skin_checked="1">
    
    <div class="flex flex-col gap-y-8 my-12 mx-2 lg:w-[768px] w-full" bis_skin_checked="1">
      <div class="flex flex-col gap-y-2" bis_skin_checked="1">
        <h1 class="text-4xl font-semibold">Lesson 1: Numbers</h1>
      </div>
      <div bis_skin_checked="1">
        <div class="relative" bis_skin_checked="1">
          <div class="content-wrapper overflow-hidden relative" bis_skin_checked="1">
            <div role="presentation" class="simple-editor-content transition-all duration-300" bis_skin_checked="1">
              <div contenteditable="false" autocomplete="off" autocorrect="off" autocapitalize="off"
                aria-label="Lesson content area, start typing to enter text." translate="no"
                class="tiptap ProseMirror focus:outline-none prose prose-lg dark:prose-invert max-w-none"
                bis_skin_checked="1">
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Numbers are everywhere: from counting
                    apples in a basket
                    to describing the motion of planets, numbers appear
                    everywhere. Over centuries, mathematicians have classified
                    numbers into different types based on their properties. In
                    this lesson, we will explore some classes of
                    numbers.</span>
                </p>
                <h2>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Natural numbers</span>
                </h2>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">We start with the <em>natural
                      numbers</em>. These are the
                    numbers we use for counting objects:</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math" data-latex=" \mathbb{N} = \{1, 2, 3, 4, \dots\}. "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">N</mi>
                                <mo>=</mo>
                                <mo stretchy="false">{</mo>
                                <mn>1</mn>
                                <mo separator="true">,</mo>
                                <mn>2</mn>
                                <mo separator="true">,</mo>
                                <mn>3</mn>
                                <mo separator="true">,</mo>
                                <mn>4</mn>
                                <mo separator="true">,</mo>
                                <mo>…</mo> <mo stretchy="false">}</mo>
                                <mi mathvariant="normal">.</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{N} = \{1, 2, 3, 4, \dots\}.
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6889em"></span><span class="mord mathbb">N</span><span
                              class="mspace" style="margin-right: 0.2778em"></span><span class="mrel">=</span><span
                              class="mspace" style="margin-right: 0.2778em"></span></span><span class="base"><span
                              class="strut" style="height: 1em; vertical-align: -0.25em"></span><span
                              class="mopen">{</span><span class="mord">1</span><span class="mpunct">,</span><span
                              class="mspace" style="margin-right: 0.1667em"></span><span class="mord">2</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mord">3</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord">4</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="minner">…</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mclose">}</span><span class="mord">.</span></span></span></span></span><img
                      class="ProseMirror-separator" alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">They are traditionally denoted by the
                    symbol
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" \mathbb{N} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">N</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{N}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6889em"></span><span
                              class="mord mathbb">N</span></span></span></span></span>.</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Note that
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" 0 "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mn>0</mn>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                0
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6444em"></span><span
                              class="mord">0</span></span></span></span></span>
                    is not always included in this set. To make this
                    distinction clear, different notations are used:</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math"
                      data-latex=" \mathbb{N}^+ = \{1, 2, 3, 4, \dots\} \quad \text{(without zero)} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <msup>
                                  <mi mathvariant="double-struck">N</mi>
                                  <mo>+</mo>
                                </msup>
                                <mo>=</mo>
                                <mo stretchy="false">{</mo>
                                <mn>1</mn>
                                <mo separator="true">,</mo>
                                <mn>2</mn>
                                <mo separator="true">,</mo>
                                <mn>3</mn>
                                <mo separator="true">,</mo>
                                <mn>4</mn>
                                <mo separator="true">,</mo>
                                <mo>…</mo> <mo stretchy="false">}</mo>
                                <mspace width="1em"></mspace>
                                <mtext>(without&nbsp;zero)</mtext>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{N}^+ = \{1, 2, 3, 4, \dots\} \quad
                                \text{(without zero)}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.7713em"></span><span class="mord"><span
                                class="mord mathbb">N</span><span class="msupsub"><span class="vlist-t"><span
                                    class="vlist-r"><span class="vlist" style="height: 0.7713em"><span class="" style="
                                            top: -3.063em;
                                            margin-right: 0.05em;
                                          "><span class="pstrut" style="height: 2.7em"></span><span
                                          class="sizing reset-size6 size3 mtight"><span
                                            class="mbin mtight">+</span></span></span></span></span></span></span></span><span
                              class="mspace" style="margin-right: 0.2778em"></span><span class="mrel">=</span><span
                              class="mspace" style="margin-right: 0.2778em"></span></span><span class="base"><span
                              class="strut" style="height: 1em; vertical-align: -0.25em"></span><span
                              class="mopen">{</span><span class="mord">1</span><span class="mpunct">,</span><span
                              class="mspace" style="margin-right: 0.1667em"></span><span class="mord">2</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mord">3</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord">4</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="minner">…</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mclose">}</span><span class="mspace" style="margin-right: 1em"></span><span
                              class="mord text"><span
                                class="mord">(without&nbsp;zero)</span></span></span></span></span></span><img
                      class="ProseMirror-separator" alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math"
                      data-latex=" \mathbb{N}_0 = \{0, 1, 2, 3, 4, \dots\} \quad \text{(with zero included)} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <msub>
                                  <mi mathvariant="double-struck">N</mi>
                                  <mn>0</mn>
                                </msub>
                                <mo>=</mo>
                                <mo stretchy="false">{</mo>
                                <mn>0</mn>
                                <mo separator="true">,</mo>
                                <mn>1</mn>
                                <mo separator="true">,</mo>
                                <mn>2</mn>
                                <mo separator="true">,</mo>
                                <mn>3</mn>
                                <mo separator="true">,</mo>
                                <mn>4</mn>
                                <mo separator="true">,</mo>
                                <mo>…</mo> <mo stretchy="false">}</mo>
                                <mspace width="1em"></mspace>
                                <mtext>(with&nbsp;zero&nbsp;included)</mtext>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{N}_0 = \{0, 1, 2, 3, 4, \dots\} \quad
                                \text{(with zero included)}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="
                                  height: 0.8389em;
                                  vertical-align: -0.15em;
                                "></span><span class="mord"><span class="mord mathbb">N</span><span
                                class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist"
                                      style="height: 0.3011em"><span class="" style="
                                            top: -2.55em;
                                            margin-left: 0em;
                                            margin-right: 0.05em;
                                          "><span class="pstrut" style="height: 2.7em"></span><span
                                          class="sizing reset-size6 size3 mtight"><span
                                            class="mord mtight">0</span></span></span></span><span
                                      class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist"
                                      style="height: 0.15em"><span
                                        class=""></span></span></span></span></span></span><span class="mspace"
                              style="margin-right: 0.2778em"></span><span class="mrel">=</span><span class="mspace"
                              style="margin-right: 0.2778em"></span></span><span class="base"><span class="strut"
                              style="height: 1em; vertical-align: -0.25em"></span><span class="mopen">{</span><span
                              class="mord">0</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord">1</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mord">2</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord">3</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mord">4</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="minner">…</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mclose">}</span><span class="mspace"
                              style="margin-right: 1em"></span><span class="mord text"><span
                                class="mord">(with&nbsp;zero&nbsp;included)</span></span></span></span></span></span><img
                      class="ProseMirror-separator" alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Natural numbers are closed under addition
                    and
                    multiplication — that is, adding or multiplying two
                    natural numbers always produces another natural
                    number.</span>
                </p>
                <h3>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Integers</span>
                </h3>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">The next step is to extend our number
                    system to include
                    negative numbers. By adding the negatives of natural
                    numbers (and zero), we obtain the <em>integers</em>:</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math" data-latex=" \mathbb{Z} = \{\dots, -3, -2, -1, 0, 1, 2, 3, \dots\} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">Z</mi>
                                <mo>=</mo>
                                <mo stretchy="false">{</mo>
                                <mo>…</mo>
                                <mo separator="true">,</mo>
                                <mo>−</mo>
                                <mn>3</mn>
                                <mo separator="true">,</mo>
                                <mo>−</mo>
                                <mn>2</mn>
                                <mo separator="true">,</mo>
                                <mo>−</mo>
                                <mn>1</mn>
                                <mo separator="true">,</mo>
                                <mn>0</mn>
                                <mo separator="true">,</mo>
                                <mn>1</mn>
                                <mo separator="true">,</mo>
                                <mn>2</mn>
                                <mo separator="true">,</mo>
                                <mn>3</mn>
                                <mo separator="true">,</mo>
                                <mo>…</mo> <mo stretchy="false">}</mo>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{Z} = \{\dots, -3, -2, -1, 0, 1, 2, 3,
                                \dots\}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6889em"></span><span class="mord mathbb">Z</span><span
                              class="mspace" style="margin-right: 0.2778em"></span><span class="mrel">=</span><span
                              class="mspace" style="margin-right: 0.2778em"></span></span><span class="base"><span
                              class="strut" style="height: 1em; vertical-align: -0.25em"></span><span
                              class="mopen">{</span><span class="minner">…</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord">−</span><span
                              class="mord">3</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord">−</span><span
                              class="mord">2</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord">−</span><span
                              class="mord">1</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord">0</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mord">1</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord">2</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mord">3</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="minner">…</span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span
                              class="mclose">}</span></span></span></span></span><img class="ProseMirror-separator"
                      alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">The symbol
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" \mathbb{Z} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">Z</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{Z}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6889em"></span><span
                              class="mord mathbb">Z</span></span></span></span></span>
                    comes from the German word <em>Zahlen</em>, meaning
                    “numbers.” Integers are closed under addition,
                    subtraction, and multiplication.</span>
                </p>
                <h3>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Rational numbers</span>
                </h3>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">What if we need to describe parts of a
                    whole, such as
                    half a cake or three quarters of a metre? For this, we use
                    <em>rational numbers</em>. A rational number is any number
                    that can be expressed as a fraction:</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math"
                      data-latex=" \frac{p}{q}, \quad p \in \mathbb{Z}, \; q \in \mathbb{Z} \setminus \{0\} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mfrac>
                                  <mi>p</mi>
                                  <mi>q</mi>
                                </mfrac>
                                <mo separator="true">,</mo>
                                <mspace width="1em"></mspace>
                                <mi>p</mi>
                                <mo>∈</mo>
                                <mi mathvariant="double-struck">Z</mi>
                                <mo separator="true">,</mo>  <mi>q</mi>
                                <mo>∈</mo>
                                <mi mathvariant="double-struck">Z</mi>
                                <mo>∖</mo>
                                <mo stretchy="false">{</mo>
                                <mn>0</mn>
                                <mo stretchy="false">}</mo>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \frac{p}{q}, \quad p \in \mathbb{Z}, \; q \in
                                \mathbb{Z} \setminus \{0\}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="
                                  height: 1.2286em;
                                  vertical-align: -0.4811em;
                                "></span><span class="mord"><span class="mopen nulldelimiter"></span><span
                                class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist"
                                      style="height: 0.7475em"><span class="" style="top: -2.655em"><span class="pstrut"
                                          style="height: 3em"></span><span class="sizing reset-size6 size3 mtight"><span
                                            class="mord mtight"><span class="mord mathnormal mtight"
                                              style="margin-right: 0.0359em">q</span></span></span></span><span class=""
                                        style="top: -3.23em"><span class="pstrut" style="height: 3em"></span><span
                                          class="frac-line" style="border-bottom-width: 0.04em"></span></span><span
                                        class="" style="top: -3.4461em"><span class="pstrut"
                                          style="height: 3em"></span><span class="sizing reset-size6 size3 mtight"><span
                                            class="mord mtight"><span
                                              class="mord mathnormal mtight">p</span></span></span></span></span><span
                                      class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist"
                                      style="height: 0.4811em"><span class=""></span></span></span></span></span><span
                                class="mclose nulldelimiter"></span></span><span class="mpunct">,</span><span
                              class="mspace" style="margin-right: 1em"></span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord mathnormal">p</span><span
                              class="mspace" style="margin-right: 0.2778em"></span><span class="mrel">∈</span><span
                              class="mspace" style="margin-right: 0.2778em"></span></span><span class="base"><span
                              class="strut" style="
                                  height: 0.8833em;
                                  vertical-align: -0.1944em;
                                "></span><span class="mord mathbb">Z</span><span class="mpunct">,</span><span
                              class="mspace" style="margin-right: 0.2778em"></span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord mathnormal"
                              style="margin-right: 0.0359em">q</span><span class="mspace"
                              style="margin-right: 0.2778em"></span><span class="mrel">∈</span><span class="mspace"
                              style="margin-right: 0.2778em"></span></span><span class="base"><span class="strut"
                              style="height: 1em; vertical-align: -0.25em"></span><span
                              class="mord mathbb">Z</span><span class="mspace"
                              style="margin-right: 0.2222em"></span><span class="mbin">∖</span><span class="mspace"
                              style="margin-right: 0.2222em"></span></span><span class="base"><span class="strut"
                              style="height: 1em; vertical-align: -0.25em"></span><span class="mopen">{</span><span
                              class="mord">0</span><span class="mclose">}</span></span></span></span></span><img
                      class="ProseMirror-separator" alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">The set of all rational numbers is
                    denoted by
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" \mathbb{Q} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">Q</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{Q}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="
                                  height: 0.8556em;
                                  vertical-align: -0.1667em;
                                "></span><span class="mord mathbb">Q</span></span></span></span></span>
                    (from the word <em>quotient</em>):</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math"
                      data-latex=" \mathbb{Q} = \left\{ \tfrac{p}{q} \;\middle|\; p, q \in \mathbb{Z}, \ q \neq 0 \right\} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">Q</mi>
                                <mo>=</mo>
                                <mrow>
                                  <mo fence="true">{</mo>
                                  <mfrac>
                                    <mi>p</mi>
                                    <mi>q</mi>
                                  </mfrac>  <mo fence="true" lspace="0.05em" rspace="0.05em">|</mo>  <mi>p</mi>
                                  <mo separator="true">,</mo>
                                  <mi>q</mi>
                                  <mo>∈</mo>
                                  <mi mathvariant="double-struck">Z</mi>
                                  <mo separator="true">,</mo>
                                  <mtext>&nbsp;</mtext>
                                  <mi>q</mi>
                                  <mo mathvariant="normal">≠</mo>
                                  <mn>0</mn>
                                  <mo fence="true">}</mo>
                                </mrow>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{Q} = \left\{ \tfrac{p}{q} \;\middle|\;
                                p, q \in \mathbb{Z}, \ q \neq 0 \right\}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="
                                  height: 0.8556em;
                                  vertical-align: -0.1667em;
                                "></span><span class="mord mathbb">Q</span><span class="mspace"
                              style="margin-right: 0.2778em"></span><span class="mrel">=</span><span class="mspace"
                              style="margin-right: 0.2778em"></span></span><span class="base"><span class="strut"
                              style="height: 1.8em; vertical-align: -0.65em"></span><span class="minner"><span
                                class="mopen delimcenter" style="top: 0em"><span
                                  class="delimsizing size2">{</span></span><span class="mord"><span
                                  class="mopen nulldelimiter"></span><span class="mfrac"><span
                                    class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist"
                                        style="height: 0.7475em"><span class="" style="top: -2.655em"><span
                                            class="pstrut" style="height: 3em"></span><span
                                            class="sizing reset-size6 size3 mtight"><span class="mord mtight"><span
                                                class="mord mathnormal mtight"
                                                style="margin-right: 0.0359em">q</span></span></span></span><span
                                          class="" style="top: -3.23em"><span class="pstrut"
                                            style="height: 3em"></span><span class="frac-line" style="
                                                border-bottom-width: 0.04em;
                                              "></span></span><span class="" style="top: -3.4461em"><span
                                            class="pstrut" style="height: 3em"></span><span
                                            class="sizing reset-size6 size3 mtight"><span class="mord mtight"><span
                                                class="mord mathnormal mtight">p</span></span></span></span></span><span
                                        class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist"
                                        style="height: 0.4811em"><span class=""></span></span></span></span></span><span
                                  class="mclose nulldelimiter"></span></span><span class="mspace"
                                style="margin-right: 0.2778em"></span><span class=""><span
                                  class="delimsizing mult"><span class="vlist-t vlist-t2"><span class="vlist-r"><span
                                        class="vlist" style="height: 1.15em"><span class="" style="top: -3.15em"><span
                                            class="pstrut" style="height: 3.8em"></span><span class="" style="
                                                width: 0.333em;
                                                height: 1.8em;
                                              "><svg width="0.333em" height="1.800em" viewBox="0 0 333 1800">
                                              <path d="M145 15 v585 v600 v585 c2.667,10,9.667,15,21,15
c10,0,16.667,-5,20,-15 v-585 v-600 v-585 c-2.667,-10,-9.667,-15,-21,-15
c-10,0,-16.667,5,-20,15z M188 15 H145 v585 v600 v585 h43z"></path>
                                            </svg></span></span></span><span class="vlist-s">​</span></span><span
                                      class="vlist-r"><span class="vlist" style="height: 0.65em"><span
                                          class=""></span></span></span></span></span></span><span class="mspace"
                                style="margin-right: 0.2778em"></span><span class="mord mathnormal">p</span><span
                                class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                                class="mord mathnormal" style="margin-right: 0.0359em">q</span><span class="mspace"
                                style="margin-right: 0.2778em"></span><span class="mrel">∈</span><span class="mspace"
                                style="margin-right: 0.2778em"></span><span class="mord mathbb">Z</span><span
                                class="mpunct">,</span><span class="mspace">&nbsp;</span><span class="mspace"
                                style="margin-right: 0.1667em"></span><span class="mord mathnormal"
                                style="margin-right: 0.0359em">q</span><span class="mspace"
                                style="margin-right: 0.2778em"></span><span class="mrel"><span class="mrel"><span
                                    class="mord vbox"><span class="thinbox"><span class="rlap"><span class="strut"
                                          style="
                                              height: 0.8889em;
                                              vertical-align: -0.1944em;
                                            "></span><span class="inner"><span class="mord"><span
                                              class="mrel"></span></span></span><span
                                          class="fix"></span></span></span></span></span><span
                                  class="mrel">=</span></span><span class="mspace"
                                style="margin-right: 0.2778em"></span><span class="mord">0</span><span
                                class="mclose delimcenter" style="top: 0em"><span
                                  class="delimsizing size2">}</span></span></span></span></span></span></span><img
                      class="ProseMirror-separator" alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Every rational number has a decimal
                    representation that
                    either terminates (e.g.
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" 0.25 "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mn>0.25</mn>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                0.25
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6444em"></span><span
                              class="mord">0.25</span></span></span></span></span>) or repeats periodically (e.g.
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" 0.333\ldots "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mn>0.333</mn>
                                <mo>…</mo>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                0.333\ldots
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6444em"></span><span class="mord">0.333</span><span
                              class="mspace" style="margin-right: 0.1667em"></span><span
                              class="minner">…</span></span></span></span></span>).</span>
                </p>
                <h3>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Irrational numbers</span>
                </h3>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Not all numbers can be written as a ratio
                    of integers.
                    Numbers such as</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math" data-latex=" \pi, \quad e, \quad \varphi " contenteditable="false"><span
                        class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi>π</mi>
                                <mo separator="true">,</mo>
                                <mspace width="1em"></mspace>
                                <mi>e</mi>
                                <mo separator="true">,</mo>
                                <mspace width="1em"></mspace>
                                <mi>φ</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \pi, \quad e, \quad \varphi
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="
                                  height: 0.625em;
                                  vertical-align: -0.1944em;
                                "></span><span class="mord mathnormal" style="margin-right: 0.0359em">π</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 1em"></span><span
                              class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mord mathnormal">e</span><span class="mpunct">,</span><span class="mspace"
                              style="margin-right: 1em"></span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span
                              class="mord mathnormal">φ</span></span></span></span></span><img
                      class="ProseMirror-separator" alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">are called <em>irrational numbers</em>.
                    Their decimal
                    expansions go on forever without repeating.
                  </span>
                </p>
                <h3>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Real numbers</span>
                </h3>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">By combining rational and irrational
                    numbers, we obtain
                    the <em>real numbers</em>, denoted by
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" \mathbb{R} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">R</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{R}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6889em"></span><span
                              class="mord mathbb">R</span></span></span></span></span>. Geometrically, the real numbers
                    correspond to all
                    points on an infinite number line:</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math"
                      data-latex=" \mathbb{R} = \mathbb{Q} \cup (\mathbb{R} \setminus \mathbb{Q}) "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">R</mi>
                                <mo>=</mo>
                                <mi mathvariant="double-struck">Q</mi>
                                <mo>∪</mo>
                                <mo stretchy="false">(</mo>
                                <mi mathvariant="double-struck">R</mi>
                                <mo>∖</mo>
                                <mi mathvariant="double-struck">Q</mi>
                                <mo stretchy="false">)</mo>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{R} = \mathbb{Q} \cup (\mathbb{R}
                                \setminus \mathbb{Q})
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6889em"></span><span class="mord mathbb">R</span><span
                              class="mspace" style="margin-right: 0.2778em"></span><span class="mrel">=</span><span
                              class="mspace" style="margin-right: 0.2778em"></span></span><span class="base"><span
                              class="strut" style="
                                  height: 0.8556em;
                                  vertical-align: -0.1667em;
                                "></span><span class="mord mathbb">Q</span><span class="mspace"
                              style="margin-right: 0.2222em"></span><span class="mbin">∪</span><span class="mspace"
                              style="margin-right: 0.2222em"></span></span><span class="base"><span class="strut"
                              style="height: 1em; vertical-align: -0.25em"></span><span class="mopen">(</span><span
                              class="mord mathbb">R</span><span class="mspace"
                              style="margin-right: 0.2222em"></span><span class="mbin">∖</span><span class="mspace"
                              style="margin-right: 0.2222em"></span></span><span class="base"><span class="strut"
                              style="height: 1em; vertical-align: -0.25em"></span><span
                              class="mord mathbb">Q</span><span class="mclose">)</span></span></span></span></span><img
                      class="ProseMirror-separator" alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Real numbers allow us to measure
                    continuous quantities
                    such as length, mass, and time.</span>
                </p>
                <h3>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Complex numbers</span>
                </h3>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Eventually, we encounter problems that
                    even real numbers
                    cannot solve — for example, the equation</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math" data-latex=" x^2 + 1 = 0 " contenteditable="false"><span
                        class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <msup>
                                  <mi>x</mi>
                                  <mn>2</mn>
                                </msup>
                                <mo>+</mo>
                                <mn>1</mn>
                                <mo>=</mo>
                                <mn>0</mn>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                x^2 + 1 = 0
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="
                                  height: 0.8974em;
                                  vertical-align: -0.0833em;
                                "></span><span class="mord"><span class="mord mathnormal">x</span><span
                                class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist"
                                      style="height: 0.8141em"><span class="" style="
                                            top: -3.063em;
                                            margin-right: 0.05em;
                                          "><span class="pstrut" style="height: 2.7em"></span><span
                                          class="sizing reset-size6 size3 mtight"><span
                                            class="mord mtight">2</span></span></span></span></span></span></span></span><span
                              class="mspace" style="margin-right: 0.2222em"></span><span class="mbin">+</span><span
                              class="mspace" style="margin-right: 0.2222em"></span></span><span class="base"><span
                              class="strut" style="height: 0.6444em"></span><span class="mord">1</span><span
                              class="mspace" style="margin-right: 0.2778em"></span><span class="mrel">=</span><span
                              class="mspace" style="margin-right: 0.2778em"></span></span><span class="base"><span
                              class="strut" style="height: 0.6444em"></span><span
                              class="mord">0</span></span></span></span></span><img class="ProseMirror-separator"
                      alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">To address this, mathematicians
                    introduced the
                    <em>complex numbers</em>, which extend
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" \mathbb{R} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">R</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{R}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6889em"></span><span
                              class="mord mathbb">R</span></span></span></span></span>
                    by including an <em>imaginary unit</em>
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" i "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi>i</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                i
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6595em"></span><span
                              class="mord mathnormal">i</span></span></span></span></span>
                    with the property
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" i^2 = -1 "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <msup>
                                  <mi>i</mi>
                                  <mn>2</mn>
                                </msup>
                                <mo>=</mo>
                                <mo>−</mo>
                                <mn>1</mn>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                i^2 = -1
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.8141em"></span><span class="mord"><span
                                class="mord mathnormal">i</span><span class="msupsub"><span class="vlist-t"><span
                                    class="vlist-r"><span class="vlist" style="height: 0.8141em"><span class="" style="
                                            top: -3.063em;
                                            margin-right: 0.05em;
                                          "><span class="pstrut" style="height: 2.7em"></span><span
                                          class="sizing reset-size6 size3 mtight"><span
                                            class="mord mtight">2</span></span></span></span></span></span></span></span><span
                              class="mspace" style="margin-right: 0.2778em"></span><span class="mrel">=</span><span
                              class="mspace" style="margin-right: 0.2778em"></span></span><span class="base"><span
                              class="strut" style="
                                  height: 0.7278em;
                                  vertical-align: -0.0833em;
                                "></span><span class="mord">−</span><span
                              class="mord">1</span></span></span></span></span>. The set of complex numbers, denoted
                    <span class="tiptap-mathematics-render" data-type="inline-math" data-latex=" \mathbb{C} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi mathvariant="double-struck">C</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                \mathbb{C}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="height: 0.6889em"></span><span
                              class="mord mathbb">C</span></span></span></span></span>, contains all numbers of the
                    form</span>
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive"><span class="tiptap-mathematics-render"
                      data-type="inline-math" data-latex=" a + bi, \quad a, b \in \mathbb{R} "
                      contenteditable="false"><span class="katex"><span class="katex-mathml"><math
                            xmlns="http://www.w3.org/1998/Math/MathML">
                            <semantics>
                              <mrow>
                                <mi>a</mi>
                                <mo>+</mo>
                                <mi>b</mi>
                                <mi>i</mi>
                                <mo separator="true">,</mo>
                                <mspace width="1em"></mspace>
                                <mi>a</mi>
                                <mo separator="true">,</mo>
                                <mi>b</mi>
                                <mo>∈</mo>
                                <mi mathvariant="double-struck">R</mi>
                              </mrow>
                              <annotation encoding="application/x-tex">
                                a + bi, \quad a, b \in \mathbb{R}
                              </annotation>
                            </semantics>
                          </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span
                              class="strut" style="
                                  height: 0.6667em;
                                  vertical-align: -0.0833em;
                                "></span><span class="mord mathnormal">a</span><span class="mspace"
                              style="margin-right: 0.2222em"></span><span class="mbin">+</span><span class="mspace"
                              style="margin-right: 0.2222em"></span></span><span class="base"><span class="strut" style="
                                  height: 0.8889em;
                                  vertical-align: -0.1944em;
                                "></span><span class="mord mathnormal">bi</span><span class="mpunct">,</span><span
                              class="mspace" style="margin-right: 1em"></span><span class="mspace"
                              style="margin-right: 0.1667em"></span><span class="mord mathnormal">a</span><span
                              class="mpunct">,</span><span class="mspace" style="margin-right: 0.1667em"></span><span
                              class="mord mathnormal">b</span><span class="mspace"
                              style="margin-right: 0.2778em"></span><span class="mrel">∈</span><span class="mspace"
                              style="margin-right: 0.2778em"></span></span><span class="base"><span class="strut"
                              style="height: 0.6889em"></span><span
                              class="mord mathbb">R</span></span></span></span></span><img class="ProseMirror-separator"
                      alt="" /></span><br class="ProseMirror-trailingBreak" />
                </p>
                <p>
                  <span style="font-family: &quot;Patrick Hand&quot;, cursive">Complex numbers are commonly used in
                    mathematics and
                    engineering.</span>
                </p>
                <p><br class="ProseMirror-trailingBreak" /></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

</html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});



// import React, { useEffect, useState } from "react";
// import { View, StyleSheet } from "react-native";
// import { WebView } from "react-native-webview";
// import * as FileSystem from "expo-file-system";
// import { Asset } from "expo-asset";

// type HtmlRendererProps = { htmlFile: string };

// export default function HtmlRenderer({ htmlFile }: HtmlRendererProps) {
//   const [htmlContent, setHtmlContent] = useState<string | null>(null);
//   const htmlFiles: Record<string, any> = {
//     "clean.html": require("../assets/html/clean.html"),
//     // add more as needed
//     };

//   useEffect(() => {
//     const loadHtml = async () => {
//       try {
//         const htmlAsset = Asset.fromModule(htmlFiles[htmlFile]);
//         await htmlAsset.downloadAsync();

//         // Read as string
//         const htmlText = await FileSystem.readAsStringAsync(htmlAsset.localUri!);

//         // Wrap with full HTML
//         const fullHtml = `
//           <html>
//             <head>
//               <meta name="viewport" content="width=device-width, initial-scale=1.0">
//               <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
//               <style>
//                 body { font-family: sans-serif; padding: 16px; background: #fff; }
//                 img { max-width: 100%; }
//               </style>
//             </head>
//             <body>
//               ${htmlText}
//             </body>
//           </html>
//         `;
//         setHtmlContent(fullHtml);
//       } catch (err) {
//         console.error("Failed to load HTML:", err);
//       }
//     };

//     loadHtml();
//   }, [htmlFile]);

//   if (!htmlContent) return <View style={styles.container} />; // placeholder

//   return (
//     <View style={styles.container}>
//       <WebView
//         originWhitelist={["*"]}
//         source={{ html: htmlContent }}
//         style={{ flex: 1 }}
//         javaScriptEnabled
//         domStorageEnabled
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({ container: { flex: 1 } });




// import React from "react";
// import { View, StyleSheet } from "react-native";
// import { WebView } from "react-native-webview";

// type HtmlRendererProps = {
//   htmlFile: string; // path in assets, e.g. "lesson1.html"
// };

// export default function HtmlRenderer({ htmlFile }: HtmlRendererProps) {
//   const source = require(`../assets/html/clean.html`);

//   return (
//     <View style={styles.container}>
//       <WebView
//         originWhitelist={["*"]}
//         source={source}
//         style={{ flex: 1 }}
//         javaScriptEnabled={true}
//         domStorageEnabled={true}
//         allowFileAccess={true}
//         allowUniversalAccessFromFileURLs={true}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
// });
