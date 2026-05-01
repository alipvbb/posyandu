import{d as q,o as u,c as p,b as a,t as s,m as C,a as U,q as j,f as l,w as f,g as V,n as v,j as d,e as b,A as N,L as B}from"./index-DEukyOYf.js";import{_ as I}from"./AppButton.vue_vue_type_script_setup_true_lang-h1wU3ZBX.js";import{A as w}from"./AppCard-A8nXypLO.js";import{_ as R}from"./AppLoadingBlock.vue_vue_type_script_setup_true_lang-CjH3Qut2.js";import{t as P}from"./toddlers.service-bua7qwlA.js";import{f as _,a as z,g as S}from"./format-D6_TRnpA.js";const Q={class:"qr-card"},E=["src"],F={key:0},L=q({__name:"QrCodeCardPreview",props:{image:{},value:{},title:{},showValue:{type:Boolean}},setup(o){return(h,x)=>(u(),p("div",Q,[a("strong",null,s(o.title||"QR Kartu Posyandu"),1),a("img",{src:o.image,alt:"QR Code Posyandu",class:"qr-image"},null,8,E),o.showValue!==!1?(u(),p("small",F,s(o.value),1)):C("",!0)]))}}),M={key:0,class:"form-grid"},J={key:1,class:"form-grid"},O={key:2,class:"form-grid"},G={class:"page-head"},H={class:"print-card card-print-sheet idcard-preview"},W={class:"idcard-preview-head"},Y={class:"idcard-preview-brand"},X={class:"muted-text"},Z={class:"idcard-preview-number"},aa={class:"status-badge","data-tone":"green"},ea={class:"idcard-preview-body"},ta={class:"form-grid"},ra={style:{margin:"0"}},ia={class:"muted-text",style:{margin:"0"}},sa={class:"idcard-preview-meta"},pa=q({__name:"CardView",setup(o){const h=V(),x=U(),t=v(null),m=v(null),y=v(!0),k=v(!1),r=i=>String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),K=()=>{var $,A;if(!t.value||!m.value)return;const i=t.value.toddler,e=_(i.tanggal_lahir),c=z(i.tanggal_lahir),g=S(i.jenis_kelamin),T=_(t.value.updatedAt||t.value.createdAt||new Date().toISOString()),D=`<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cetak Kartu Posyandu - ${r(t.value.cardNumber)}</title>
    <style>
      @page { size: A5 landscape; margin: 7mm; }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body {
        margin: 0;
        font-family: "Nunito Sans", "Segoe UI", sans-serif;
        color: #14352a;
        background: #ffffff;
      }
      .sheet {
        width: 100%;
        min-height: calc(148mm - 14mm);
      }
      .id-card {
        height: 100%;
        border-radius: 5mm;
        border: 0.35mm solid #c9ded4;
        overflow: hidden;
        background:
          radial-gradient(circle at 92% 12%, rgba(90, 163, 143, 0.12), transparent 40%),
          radial-gradient(circle at 8% 88%, rgba(240, 185, 104, 0.1), transparent 34%),
          linear-gradient(180deg, #ffffff 0%, #f7fcf9 100%);
        display: grid;
        grid-template-rows: auto 1fr auto;
      }
      .header {
        background: linear-gradient(135deg, #2f6f61, #5aa38f);
        color: #ffffff;
        padding: 6.5mm 7.5mm 5.5mm;
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 6mm;
      }
      .brand-wrap {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 3mm;
      }
      .brand-mark {
        width: 10.5mm;
        height: 10.5mm;
        border-radius: 2.2mm;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.5);
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 10pt;
        letter-spacing: 0.4px;
      }
      .org-name {
        margin: 0;
        font-size: 8.3pt;
        opacity: 0.9;
        letter-spacing: 0.2px;
      }
      .main-title {
        margin: 1mm 0 0;
        font-size: 14.5pt;
        letter-spacing: 0.25px;
      }
      .subtitle {
        margin: 0.8mm 0 0;
        font-size: 8.2pt;
        opacity: 0.92;
      }
      .header-right {
        display: grid;
        justify-items: end;
        gap: 1.2mm;
      }
      .header-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 1.4mm 2.6mm;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.45);
        font-size: 8pt;
        font-weight: 700;
      }
      .header-card-number {
        font-size: 12pt;
        letter-spacing: 0.2px;
        font-weight: 700;
      }
      .body {
        padding: 6mm 7.5mm;
        display: grid;
        grid-template-columns: 1.18fr 0.82fr;
        gap: 5.5mm;
      }
      .identity {
        display: grid;
        align-content: start;
        gap: 4mm;
      }
      .name-label {
        margin: 0;
        font-size: 8pt;
        color: #58796c;
      }
      .child-name {
        margin: 0;
        font-size: 19pt;
        line-height: 1.1;
        color: #123629;
      }
      .child-code {
        margin: 0.8mm 0 0;
        color: #4f6f63;
        font-size: 9.3pt;
        font-weight: 700;
      }
      .meta-box {
        border: 0.35mm solid #d6e6df;
        border-radius: 3mm;
        background: #ffffff;
        padding: 3.2mm 3.4mm;
      }
      .meta-grid {
        display: grid;
        gap: 2.6mm;
        font-size: 9.6pt;
      }
      .meta-row {
        display: grid;
        grid-template-columns: 30mm 1fr;
        gap: 2mm;
      }
      .meta-row span {
        color: #5b7a6e;
      }
      .meta-row b {
        color: #123629;
        font-weight: 700;
      }
      .note {
        margin: 0;
        color: #5b7a6e;
        font-size: 8.1pt;
      }
      .qr-side {
        border: 0.35mm solid #d6e6df;
        border-radius: 3mm;
        background: #ffffff;
        padding: 3.3mm;
        display: grid;
        align-content: start;
        justify-items: center;
        gap: 2.6mm;
        text-align: center;
      }
      .qr-title {
        margin: 0;
        font-size: 8.8pt;
        color: #204f42;
        font-weight: 700;
      }
      .qr-side img {
        width: 43mm;
        height: 43mm;
        background: #fff;
        border-radius: 1.8mm;
        border: 0.35mm solid #deebe5;
        padding: 1.1mm;
      }
      .qr-url {
        font-size: 6.8pt;
        color: #617f72;
        word-break: break-all;
      }
      .footer {
        margin-top: auto;
        border-top: 0.35mm dashed #d7e5de;
        background: #f5fbf8;
        color: #45685c;
        padding: 3.6mm 7.5mm 4mm;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 4mm;
        align-items: center;
        font-size: 8.1pt;
      }
      @media print {
        .id-card {
          break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <section class="id-card">
        <header class="header">
          <div class="brand-wrap">
            <div class="brand-mark">PA</div>
            <div>
              <p class="org-name">${r(N)}</p>
              <h1 class="main-title">KARTU IDENTITAS POSYANDU</h1>
              <p class="subtitle">Kartu resmi pemantauan tumbuh kembang anak usia 0–59 bulan</p>
            </div>
          </div>
          <div class="header-right">
            <div class="header-chip">Nomor Kartu</div>
            <div class="header-card-number">${r(t.value.cardNumber)}</div>
          </div>
        </header>

        <section class="body">
          <div class="identity">
            <p class="name-label">Nama Balita</p>
            <h2 class="child-name">${r(i.nama_lengkap)}</h2>
            <p class="child-code">${r(i.kode_balita)}</p>
            <div class="meta-box">
              <div class="meta-grid">
                <div class="meta-row"><span>TTL</span><b>${r(e)}</b></div>
                <div class="meta-row"><span>Umur</span><b>${r(c)}</b></div>
                <div class="meta-row"><span>Jenis Kelamin</span><b>${r(g)}</b></div>
                <div class="meta-row"><span>Nama Ibu</span><b>${r(i.nama_ibu)}</b></div>
                <div class="meta-row"><span>Nama Ayah</span><b>${r(i.nama_ayah||"-")}</b></div>
                <div class="meta-row"><span>Posyandu</span><b>${r((($=i.posyandu)==null?void 0:$.name)||"-")}</b></div>
                <div class="meta-row"><span>Dusun</span><b>${r(((A=i.hamlet)==null?void 0:A.name)||"-")}</b></div>
              </div>
            </div>
            <p class="note">Kartu ini dibawa saat kegiatan posyandu dan pemeriksaan rutin balita.</p>
          </div>
          <aside class="qr-side">
            <p class="qr-title">Scan untuk melihat riwayat tumbuh kembang</p>
            <img src="${r(m.value.dataUrl)}" alt="QR Kartu Posyandu" />
            <div class="qr-url">${r(t.value.publicUrl)}</div>
          </aside>
        </section>

        <footer class="footer">
          <div>Diterbitkan: ${r(T)} • Jika kartu hilang, hubungi petugas desa untuk cetak ulang.</div>
          <div>${r(B)}</div>
        </footer>
      </section>
    </div>
  </body>
</html>`,n=window.open("","_blank","noopener,noreferrer");if(!n){window.print();return}n.document.open(),n.document.write(D),n.document.close(),n.focus(),window.setTimeout(()=>{n.print(),n.close()},300)};return j(async()=>{y.value=!0,k.value=!1;try{const[i,e]=await Promise.all([P.getCard(String(h.params.id)),P.getQr(String(h.params.id))]);t.value=i,m.value=e}catch{k.value=!0,x.pushToast("Gagal memuat kartu posyandu.","error")}finally{y.value=!1}}),(i,e)=>y.value?(u(),p("div",M,[l(w,null,{default:f(()=>[l(R,{text:"Memuat kartu posyandu..."})]),_:1})])):k.value?(u(),p("div",J,[l(w,null,{default:f(()=>[...e[0]||(e[0]=[a("div",{class:"empty-state"},"Kartu posyandu gagal dimuat. Coba refresh halaman.",-1)])]),_:1})])):t.value&&m.value?(u(),p("div",O,[a("div",G,[e[2]||(e[2]=a("div",null,[a("h2",{style:{margin:"0"}},"Kartu Posyandu"),a("p",{class:"muted-text",style:{margin:"6px 0 0"}},"Versi printable dengan QR unik untuk petugas dan akses publik orang tua.")],-1)),l(I,{onClick:K},{default:f(()=>[...e[1]||(e[1]=[d("Cetak kartu",-1)])]),_:1})]),l(w,{class:"card-print-panel"},{default:f(()=>{var c,g;return[a("div",H,[a("div",W,[a("div",Y,[e[4]||(e[4]=a("div",{class:"idcard-preview-mark"},"PA",-1)),a("div",null,[a("small",X,s(b(N)),1),e[3]||(e[3]=a("h3",null,"Kartu Identitas Posyandu",-1))])]),a("div",Z,[e[5]||(e[5]=a("small",{class:"muted-text"},"Nomor Kartu",-1)),a("div",aa,s(t.value.cardNumber),1)])]),a("div",ea,[a("div",ta,[e[13]||(e[13]=a("small",{class:"muted-text"},"Nama Balita",-1)),a("h3",ra,s(t.value.toddler.nama_lengkap),1),a("p",ia,s(t.value.toddler.kode_balita),1),a("div",sa,[a("div",null,[e[6]||(e[6]=d("TTL: ",-1)),a("strong",null,s(b(_)(t.value.toddler.tanggal_lahir)),1)]),a("div",null,[e[7]||(e[7]=d("Umur: ",-1)),a("strong",null,s(b(z)(t.value.toddler.tanggal_lahir)),1)]),a("div",null,[e[8]||(e[8]=d("JK: ",-1)),a("strong",null,s(b(S)(t.value.toddler.jenis_kelamin)),1)]),a("div",null,[e[9]||(e[9]=d("Ibu: ",-1)),a("strong",null,s(t.value.toddler.nama_ibu),1)]),a("div",null,[e[10]||(e[10]=d("Ayah: ",-1)),a("strong",null,s(t.value.toddler.nama_ayah||"-"),1)]),a("div",null,[e[11]||(e[11]=d("Posyandu: ",-1)),a("strong",null,s((c=t.value.toddler.posyandu)==null?void 0:c.name),1)]),a("div",null,[e[12]||(e[12]=d("Dusun: ",-1)),a("strong",null,s((g=t.value.toddler.hamlet)==null?void 0:g.name),1)])])]),l(L,{image:m.value.dataUrl,value:t.value.publicUrl,"show-value":!1,title:"Scan data tumbuh kembang"},null,8,["image","value"])]),e[14]||(e[14]=a("small",{class:"muted-text"},"Format cetak: A5 landscape, proporsional untuk kartu identitas posyandu.",-1))])]}),_:1})])):C("",!0)}});export{pa as default};
