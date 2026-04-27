import{d as S,o as u,c,b as a,t as s,m as q,a as T,q as D,f as l,w as f,g as j,n as v,j as n,e as k,A as N,L as U}from"./index-CHHytdqu.js";import{_ as V}from"./AppButton.vue_vue_type_script_setup_true_lang-DTNmK5KS.js";import{A as w}from"./AppCard-B04T05Lm.js";import{_ as I}from"./AppLoadingBlock.vue_vue_type_script_setup_true_lang-BJFlJE-W.js";import{t as P}from"./toddlers.service-Cp2EdFP7.js";import{f as _,g as z}from"./format-BZI8Jdds.js";const R={class:"qr-card"},B=["src"],Q={key:0},E=S({__name:"QrCodeCardPreview",props:{image:{},value:{},title:{},showValue:{type:Boolean}},setup(o){return(b,x)=>(u(),c("div",R,[a("strong",null,s(o.title||"QR Kartu Posyandu"),1),a("img",{src:o.image,alt:"QR Code Posyandu",class:"qr-image"},null,8,B),o.showValue!==!1?(u(),c("small",Q,s(o.value),1)):q("",!0)]))}}),L={key:0,class:"form-grid"},M={key:1,class:"form-grid"},F={key:2,class:"form-grid"},J={class:"page-head"},O={class:"print-card card-print-sheet idcard-preview"},G={class:"idcard-preview-head"},H={class:"idcard-preview-brand"},W={class:"muted-text"},Y={class:"idcard-preview-number"},X={class:"status-badge","data-tone":"green"},Z={class:"idcard-preview-body"},aa={class:"form-grid"},ea={style:{margin:"0"}},ta={class:"muted-text",style:{margin:"0"}},ia={class:"idcard-preview-meta"},ma=S({__name:"CardView",setup(o){const b=j(),x=T(),t=v(null),m=v(null),h=v(!0),y=v(!1),i=r=>String(r??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),C=()=>{var $,A;if(!t.value||!m.value)return;const r=t.value.toddler,e=_(r.tanggal_lahir),p=z(r.jenis_kelamin),g=_(t.value.updatedAt||t.value.createdAt||new Date().toISOString()),K=`<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cetak Kartu Posyandu - ${i(t.value.cardNumber)}</title>
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
              <p class="org-name">${i(N)}</p>
              <h1 class="main-title">KARTU IDENTITAS POSYANDU</h1>
              <p class="subtitle">Kartu resmi pemantauan tumbuh kembang anak usia 0–59 bulan</p>
            </div>
          </div>
          <div class="header-right">
            <div class="header-chip">Nomor Kartu</div>
            <div class="header-card-number">${i(t.value.cardNumber)}</div>
          </div>
        </header>

        <section class="body">
          <div class="identity">
            <p class="name-label">Nama Balita</p>
            <h2 class="child-name">${i(r.nama_lengkap)}</h2>
            <p class="child-code">${i(r.kode_balita)}</p>
            <div class="meta-box">
              <div class="meta-grid">
                <div class="meta-row"><span>TTL</span><b>${i(e)}</b></div>
                <div class="meta-row"><span>Jenis Kelamin</span><b>${i(p)}</b></div>
                <div class="meta-row"><span>Nama Ibu</span><b>${i(r.nama_ibu)}</b></div>
                <div class="meta-row"><span>Nama Ayah</span><b>${i(r.nama_ayah||"-")}</b></div>
                <div class="meta-row"><span>Posyandu</span><b>${i((($=r.posyandu)==null?void 0:$.name)||"-")}</b></div>
                <div class="meta-row"><span>Dusun</span><b>${i(((A=r.hamlet)==null?void 0:A.name)||"-")}</b></div>
              </div>
            </div>
            <p class="note">Kartu ini dibawa saat kegiatan posyandu dan pemeriksaan rutin balita.</p>
          </div>
          <aside class="qr-side">
            <p class="qr-title">Scan untuk melihat riwayat tumbuh kembang</p>
            <img src="${i(m.value.dataUrl)}" alt="QR Kartu Posyandu" />
            <div class="qr-url">${i(t.value.publicUrl)}</div>
          </aside>
        </section>

        <footer class="footer">
          <div>Diterbitkan: ${i(g)} • Jika kartu hilang, hubungi petugas desa untuk cetak ulang.</div>
          <div>${i(U)}</div>
        </footer>
      </section>
    </div>
  </body>
</html>`,d=window.open("","_blank","noopener,noreferrer");if(!d){window.print();return}d.document.open(),d.document.write(K),d.document.close(),d.focus(),window.setTimeout(()=>{d.print(),d.close()},300)};return D(async()=>{h.value=!0,y.value=!1;try{const[r,e]=await Promise.all([P.getCard(String(b.params.id)),P.getQr(String(b.params.id))]);t.value=r,m.value=e}catch{y.value=!0,x.pushToast("Gagal memuat kartu posyandu.","error")}finally{h.value=!1}}),(r,e)=>h.value?(u(),c("div",L,[l(w,null,{default:f(()=>[l(I,{text:"Memuat kartu posyandu..."})]),_:1})])):y.value?(u(),c("div",M,[l(w,null,{default:f(()=>[...e[0]||(e[0]=[a("div",{class:"empty-state"},"Kartu posyandu gagal dimuat. Coba refresh halaman.",-1)])]),_:1})])):t.value&&m.value?(u(),c("div",F,[a("div",J,[e[2]||(e[2]=a("div",null,[a("h2",{style:{margin:"0"}},"Kartu Posyandu"),a("p",{class:"muted-text",style:{margin:"6px 0 0"}},"Versi printable dengan QR unik untuk petugas dan akses publik orang tua.")],-1)),l(V,{onClick:C},{default:f(()=>[...e[1]||(e[1]=[n("Cetak kartu",-1)])]),_:1})]),l(w,{class:"card-print-panel"},{default:f(()=>{var p,g;return[a("div",O,[a("div",G,[a("div",H,[e[4]||(e[4]=a("div",{class:"idcard-preview-mark"},"PA",-1)),a("div",null,[a("small",W,s(k(N)),1),e[3]||(e[3]=a("h3",null,"Kartu Identitas Posyandu",-1))])]),a("div",Y,[e[5]||(e[5]=a("small",{class:"muted-text"},"Nomor Kartu",-1)),a("div",X,s(t.value.cardNumber),1)])]),a("div",Z,[a("div",aa,[e[12]||(e[12]=a("small",{class:"muted-text"},"Nama Balita",-1)),a("h3",ea,s(t.value.toddler.nama_lengkap),1),a("p",ta,s(t.value.toddler.kode_balita),1),a("div",ia,[a("div",null,[e[6]||(e[6]=n("TTL: ",-1)),a("strong",null,s(k(_)(t.value.toddler.tanggal_lahir)),1)]),a("div",null,[e[7]||(e[7]=n("JK: ",-1)),a("strong",null,s(k(z)(t.value.toddler.jenis_kelamin)),1)]),a("div",null,[e[8]||(e[8]=n("Ibu: ",-1)),a("strong",null,s(t.value.toddler.nama_ibu),1)]),a("div",null,[e[9]||(e[9]=n("Ayah: ",-1)),a("strong",null,s(t.value.toddler.nama_ayah||"-"),1)]),a("div",null,[e[10]||(e[10]=n("Posyandu: ",-1)),a("strong",null,s((p=t.value.toddler.posyandu)==null?void 0:p.name),1)]),a("div",null,[e[11]||(e[11]=n("Dusun: ",-1)),a("strong",null,s((g=t.value.toddler.hamlet)==null?void 0:g.name),1)])])]),l(E,{image:m.value.dataUrl,value:t.value.publicUrl,"show-value":!1,title:"Scan data tumbuh kembang"},null,8,["image","value"])]),e[13]||(e[13]=a("small",{class:"muted-text"},"Format cetak: A5 landscape, proporsional untuk kartu identitas posyandu.",-1))])]}),_:1})])):q("",!0)}});export{ma as default};
