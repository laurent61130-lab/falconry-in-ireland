(function(){
  var bpId="646759cb-dee2-4fa6-b697-d9345eaf1037";
  var container=document.getElementById("blog-grid-cards-widget-646759cb-dee2-4fa6-b697-d9345eaf1037");
  if(!container) return;
  container.innerHTML='<div style="display:flex;align-items:center;justify-content:center;padding:3rem 0"><div style="height:1.5rem;width:1.5rem;border:2px solid #d1d5db;border-top-color:#2563eb;border-radius:50%;animation:bl-spin 1s linear infinite"></div></div><style>@keyframes bl-spin{to{transform:rotate(360deg)}}</style>';

  var params=new URLSearchParams(window.location.search);
  var page=parseInt(params.get("page")||"1",10);
  var catFilter=params.get("category")||"";
  var limit=12;
  var offset=(page-1)*limit;

  var fetchUrl="https://zgmrpjtpvloizvlfewuq.supabase.co/functions/v1/blog-data?endpoint=articles&blogProjectId="+bpId+"&limit="+limit+"&offset="+offset+"&templateSlug=blog-grid-cards";
  if(catFilter) fetchUrl+="&category="+encodeURIComponent(catFilter);

  fetch(fetchUrl)
    .then(function(r){return r.json()})
    .then(function(data){
      var articles=data.articles||[];
      var total=data.total||0;
      var tpl=data.template;

      if(articles.length===0){
        if(tpl&&tpl.empty_html){container.innerHTML=tpl.empty_html;}
        else{container.innerHTML='<p style="text-align:center;color:#9ca3af;padding:2rem 0">Aucun article publie</p>';}
        return;
      }

      // Format published_at for each article
      for(var k=0;k<articles.length;k++){
        var a=articles[k];
        if(a.published_at){
          try{a.published_at_formatted=new Date(a.published_at).toLocaleDateString("fr-FR");}catch(e){a.published_at_formatted="";}
        }else{a.published_at_formatted="";}
      }

      // Template-based rendering (widget pattern)
      if(tpl&&tpl.container_html&&tpl.item_html){
        function replacePlaceholders(html,obj){
          html=html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/#if\}\}/g,function(_,key,content){
            var val=obj[key];
            return (val!==null&&val!==undefined&&val!==false&&val!=='')?replacePlaceholders(content,obj):'';
          });
          html=html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,function(_,key,content){
            var val=obj[key];
            return (val!==null&&val!==undefined&&val!==false&&val!=='')?replacePlaceholders(content,obj):'';
          });
          html=html.replace(/\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,function(_,key,content){
            var val=obj[key];
            return (!val||val==='')?replacePlaceholders(content,obj):'';
          });
          html=html.replace(/\{\{(\w+)\}\}/g,function(_,key){
            var val=obj[key];
            if(val===null||val===undefined) return '';
            return String(val);
          });
          return html;
        }

        var itemsHtml='';
        var startIdx=0;
        var containerHtml=tpl.container_html;

        // Support {{#featured}}...{{/featured}} block
        var featuredMatch=containerHtml.match(/\{\{#featured\}\}([\s\S]*?)\{\{\/featured\}\}/);
        if(featuredMatch&&articles.length>0){
          var featuredHtml=replacePlaceholders(featuredMatch[1],articles[0]);
          containerHtml=containerHtml.replace(featuredMatch[0],featuredHtml);
          startIdx=1;
        }

        for(var i=startIdx;i<articles.length;i++){
          itemsHtml+=replacePlaceholders(tpl.item_html,articles[i]);
        }

        var result=containerHtml.replace('{{items}}',itemsHtml);

        // Bridge site CSS variables to widget
        var cs=getComputedStyle(document.documentElement);
        var bridges=[];
        var map=[['--primary-color','--color-primary'],['--secondary-color','--color-secondary'],['--font-body','--font-body'],['--font-heading','--font-heading']];
        for(var m=0;m<map.length;m++){
          var tgt=map[m][0],src=map[m][1];
          var v=cs.getPropertyValue(tgt).trim();
          if(!v){
            var sv=cs.getPropertyValue(src).trim();
            if(sv) bridges.push(tgt+':'+sv);
          }
        }
        var bridgeStyle=bridges.length?'<style>#blog-grid-cards-widget-646759cb-dee2-4fa6-b697-d9345eaf1037{'+bridges.join(';')+'}</style>':'';

        container.innerHTML=bridgeStyle+result;
      } else {
        // Fallback: basic grid (retro-compat when template is null)
        var html='<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        for(var i=0;i<articles.length;i++){
          var a=articles[i];
          var img=a.cover_image_url?'<img src="'+a.cover_image_url+'" alt="'+a.title+'" class="w-full h-48 object-cover"/>':'<div class="w-full h-48 bg-gray-200 flex items-center justify-center"><span class="text-gray-400">Blog</span></div>';
          html+='<a href="?slug='+a.slug+'" class="block bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden">';
          html+=img;
          html+='<div class="p-4">';
          if(a.keyword) html+='<span class="text-xs font-medium text-blue-600 uppercase">'+a.keyword+'</span>';
          html+='<h3 class="mt-1 text-lg font-semibold line-clamp-2">'+(a.title||a.slug)+'</h3>';
          if(a.meta_description) html+='<p class="mt-1 text-sm text-gray-600 line-clamp-2">'+a.meta_description+'</p>';
          if(a.published_at_formatted) html+='<time class="mt-2 text-xs text-gray-400">'+a.published_at_formatted+'</time>';
          html+='</div></a>';
        }
        html+='</div>';
        container.innerHTML=html;
      }

      // Pagination
      if(total>limit){
        var pageCount=Math.ceil(total/limit);
        var nav=document.createElement("nav");
        nav.className="flex justify-center items-center gap-2 mt-8";
        if(page>1){
          var prev=document.createElement("a");
          prev.href="?page="+(page-1)+(catFilter?"&category="+encodeURIComponent(catFilter):"");
          prev.className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50";
          prev.textContent="Precedent";
          nav.appendChild(prev);
        }
        for(var p=1;p<=pageCount;p++){
          var btn=document.createElement("a");
          btn.href="?page="+p+(catFilter?"&category="+encodeURIComponent(catFilter):"");
          btn.className="px-3 py-1.5 border rounded text-sm"+(p===page?" bg-gray-900 text-white":" hover:bg-gray-50");
          btn.textContent=String(p);
          nav.appendChild(btn);
        }
        if(page<pageCount){
          var next=document.createElement("a");
          next.href="?page="+(page+1)+(catFilter?"&category="+encodeURIComponent(catFilter):"");
          next.className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50";
          next.textContent="Suivant";
          nav.appendChild(next);
        }
        container.appendChild(nav);
      }
    })
    .catch(function(err){
      container.innerHTML='<p style="text-align:center;color:#ef4444;padding:2rem 0">Erreur lors du chargement des articles</p>';
      console.error("Blog listing error:",err);
    });
})();
(function(){
  var bpId="646759cb-dee2-4fa6-b697-d9345eaf1037";
  var container=document.getElementById("blog-featured-hero-widget-646759cb-dee2-4fa6-b697-d9345eaf1037");
  if(!container) return;
  container.innerHTML='<div style="display:flex;align-items:center;justify-content:center;padding:3rem 0"><div style="height:1.5rem;width:1.5rem;border:2px solid #d1d5db;border-top-color:#2563eb;border-radius:50%;animation:bl-spin 1s linear infinite"></div></div><style>@keyframes bl-spin{to{transform:rotate(360deg)}}</style>';

  var params=new URLSearchParams(window.location.search);
  var page=parseInt(params.get("page")||"1",10);
  var catFilter=params.get("category")||"";
  var limit=12;
  var offset=(page-1)*limit;

  var fetchUrl="https://zgmrpjtpvloizvlfewuq.supabase.co/functions/v1/blog-data?endpoint=articles&blogProjectId="+bpId+"&limit="+limit+"&offset="+offset+"&templateSlug=blog-featured-hero";
  if(catFilter) fetchUrl+="&category="+encodeURIComponent(catFilter);

  fetch(fetchUrl)
    .then(function(r){return r.json()})
    .then(function(data){
      var articles=data.articles||[];
      var total=data.total||0;
      var tpl=data.template;

      if(articles.length===0){
        if(tpl&&tpl.empty_html){container.innerHTML=tpl.empty_html;}
        else{container.innerHTML='<p style="text-align:center;color:#9ca3af;padding:2rem 0">Aucun article publie</p>';}
        return;
      }

      // Format published_at for each article
      for(var k=0;k<articles.length;k++){
        var a=articles[k];
        if(a.published_at){
          try{a.published_at_formatted=new Date(a.published_at).toLocaleDateString("fr-FR");}catch(e){a.published_at_formatted="";}
        }else{a.published_at_formatted="";}
      }

      // Template-based rendering (widget pattern)
      if(tpl&&tpl.container_html&&tpl.item_html){
        function replacePlaceholders(html,obj){
          html=html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/#if\}\}/g,function(_,key,content){
            var val=obj[key];
            return (val!==null&&val!==undefined&&val!==false&&val!=='')?replacePlaceholders(content,obj):'';
          });
          html=html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,function(_,key,content){
            var val=obj[key];
            return (val!==null&&val!==undefined&&val!==false&&val!=='')?replacePlaceholders(content,obj):'';
          });
          html=html.replace(/\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,function(_,key,content){
            var val=obj[key];
            return (!val||val==='')?replacePlaceholders(content,obj):'';
          });
          html=html.replace(/\{\{(\w+)\}\}/g,function(_,key){
            var val=obj[key];
            if(val===null||val===undefined) return '';
            return String(val);
          });
          return html;
        }

        var itemsHtml='';
        var startIdx=0;
        var containerHtml=tpl.container_html;

        // Support {{#featured}}...{{/featured}} block
        var featuredMatch=containerHtml.match(/\{\{#featured\}\}([\s\S]*?)\{\{\/featured\}\}/);
        if(featuredMatch&&articles.length>0){
          var featuredHtml=replacePlaceholders(featuredMatch[1],articles[0]);
          containerHtml=containerHtml.replace(featuredMatch[0],featuredHtml);
          startIdx=1;
        }

        for(var i=startIdx;i<articles.length;i++){
          itemsHtml+=replacePlaceholders(tpl.item_html,articles[i]);
        }

        var result=containerHtml.replace('{{items}}',itemsHtml);

        // Bridge site CSS variables to widget
        var cs=getComputedStyle(document.documentElement);
        var bridges=[];
        var map=[['--primary-color','--color-primary'],['--secondary-color','--color-secondary'],['--font-body','--font-body'],['--font-heading','--font-heading']];
        for(var m=0;m<map.length;m++){
          var tgt=map[m][0],src=map[m][1];
          var v=cs.getPropertyValue(tgt).trim();
          if(!v){
            var sv=cs.getPropertyValue(src).trim();
            if(sv) bridges.push(tgt+':'+sv);
          }
        }
        var bridgeStyle=bridges.length?'<style>#blog-featured-hero-widget-646759cb-dee2-4fa6-b697-d9345eaf1037{'+bridges.join(';')+'}</style>':'';

        container.innerHTML=bridgeStyle+result;
      } else {
        // Fallback: basic grid (retro-compat when template is null)
        var html='<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        for(var i=0;i<articles.length;i++){
          var a=articles[i];
          var img=a.cover_image_url?'<img src="'+a.cover_image_url+'" alt="'+a.title+'" class="w-full h-48 object-cover"/>':'<div class="w-full h-48 bg-gray-200 flex items-center justify-center"><span class="text-gray-400">Blog</span></div>';
          html+='<a href="?slug='+a.slug+'" class="block bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden">';
          html+=img;
          html+='<div class="p-4">';
          if(a.keyword) html+='<span class="text-xs font-medium text-blue-600 uppercase">'+a.keyword+'</span>';
          html+='<h3 class="mt-1 text-lg font-semibold line-clamp-2">'+(a.title||a.slug)+'</h3>';
          if(a.meta_description) html+='<p class="mt-1 text-sm text-gray-600 line-clamp-2">'+a.meta_description+'</p>';
          if(a.published_at_formatted) html+='<time class="mt-2 text-xs text-gray-400">'+a.published_at_formatted+'</time>';
          html+='</div></a>';
        }
        html+='</div>';
        container.innerHTML=html;
      }

      // Pagination
      if(total>limit){
        var pageCount=Math.ceil(total/limit);
        var nav=document.createElement("nav");
        nav.className="flex justify-center items-center gap-2 mt-8";
        if(page>1){
          var prev=document.createElement("a");
          prev.href="?page="+(page-1)+(catFilter?"&category="+encodeURIComponent(catFilter):"");
          prev.className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50";
          prev.textContent="Precedent";
          nav.appendChild(prev);
        }
        for(var p=1;p<=pageCount;p++){
          var btn=document.createElement("a");
          btn.href="?page="+p+(catFilter?"&category="+encodeURIComponent(catFilter):"");
          btn.className="px-3 py-1.5 border rounded text-sm"+(p===page?" bg-gray-900 text-white":" hover:bg-gray-50");
          btn.textContent=String(p);
          nav.appendChild(btn);
        }
        if(page<pageCount){
          var next=document.createElement("a");
          next.href="?page="+(page+1)+(catFilter?"&category="+encodeURIComponent(catFilter):"");
          next.className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50";
          next.textContent="Suivant";
          nav.appendChild(next);
        }
        container.appendChild(nav);
      }
    })
    .catch(function(err){
      container.innerHTML='<p style="text-align:center;color:#ef4444;padding:2rem 0">Erreur lors du chargement des articles</p>';
      console.error("Blog listing error:",err);
    });
})();
(function(){
  var bpId="646759cb-dee2-4fa6-b697-d9345eaf1037";
  var container=document.getElementById("blog-list-horizontal-widget-646759cb-dee2-4fa6-b697-d9345eaf1037");
  if(!container) return;
  container.innerHTML='<div style="display:flex;align-items:center;justify-content:center;padding:3rem 0"><div style="height:1.5rem;width:1.5rem;border:2px solid #d1d5db;border-top-color:#2563eb;border-radius:50%;animation:bl-spin 1s linear infinite"></div></div><style>@keyframes bl-spin{to{transform:rotate(360deg)}}</style>';

  var params=new URLSearchParams(window.location.search);
  var page=parseInt(params.get("page")||"1",10);
  var catFilter=params.get("category")||"";
  var limit=12;
  var offset=(page-1)*limit;

  var fetchUrl="https://zgmrpjtpvloizvlfewuq.supabase.co/functions/v1/blog-data?endpoint=articles&blogProjectId="+bpId+"&limit="+limit+"&offset="+offset+"&templateSlug=blog-list-horizontal";
  if(catFilter) fetchUrl+="&category="+encodeURIComponent(catFilter);

  fetch(fetchUrl)
    .then(function(r){return r.json()})
    .then(function(data){
      var articles=data.articles||[];
      var total=data.total||0;
      var tpl=data.template;

      if(articles.length===0){
        if(tpl&&tpl.empty_html){container.innerHTML=tpl.empty_html;}
        else{container.innerHTML='<p style="text-align:center;color:#9ca3af;padding:2rem 0">Aucun article publie</p>';}
        return;
      }

      // Format published_at for each article
      for(var k=0;k<articles.length;k++){
        var a=articles[k];
        if(a.published_at){
          try{a.published_at_formatted=new Date(a.published_at).toLocaleDateString("fr-FR");}catch(e){a.published_at_formatted="";}
        }else{a.published_at_formatted="";}
      }

      // Template-based rendering (widget pattern)
      if(tpl&&tpl.container_html&&tpl.item_html){
        function replacePlaceholders(html,obj){
          html=html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/#if\}\}/g,function(_,key,content){
            var val=obj[key];
            return (val!==null&&val!==undefined&&val!==false&&val!=='')?replacePlaceholders(content,obj):'';
          });
          html=html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,function(_,key,content){
            var val=obj[key];
            return (val!==null&&val!==undefined&&val!==false&&val!=='')?replacePlaceholders(content,obj):'';
          });
          html=html.replace(/\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,function(_,key,content){
            var val=obj[key];
            return (!val||val==='')?replacePlaceholders(content,obj):'';
          });
          html=html.replace(/\{\{(\w+)\}\}/g,function(_,key){
            var val=obj[key];
            if(val===null||val===undefined) return '';
            return String(val);
          });
          return html;
        }

        var itemsHtml='';
        var startIdx=0;
        var containerHtml=tpl.container_html;

        // Support {{#featured}}...{{/featured}} block
        var featuredMatch=containerHtml.match(/\{\{#featured\}\}([\s\S]*?)\{\{\/featured\}\}/);
        if(featuredMatch&&articles.length>0){
          var featuredHtml=replacePlaceholders(featuredMatch[1],articles[0]);
          containerHtml=containerHtml.replace(featuredMatch[0],featuredHtml);
          startIdx=1;
        }

        for(var i=startIdx;i<articles.length;i++){
          itemsHtml+=replacePlaceholders(tpl.item_html,articles[i]);
        }

        var result=containerHtml.replace('{{items}}',itemsHtml);

        // Bridge site CSS variables to widget
        var cs=getComputedStyle(document.documentElement);
        var bridges=[];
        var map=[['--primary-color','--color-primary'],['--secondary-color','--color-secondary'],['--font-body','--font-body'],['--font-heading','--font-heading']];
        for(var m=0;m<map.length;m++){
          var tgt=map[m][0],src=map[m][1];
          var v=cs.getPropertyValue(tgt).trim();
          if(!v){
            var sv=cs.getPropertyValue(src).trim();
            if(sv) bridges.push(tgt+':'+sv);
          }
        }
        var bridgeStyle=bridges.length?'<style>#blog-list-horizontal-widget-646759cb-dee2-4fa6-b697-d9345eaf1037{'+bridges.join(';')+'}</style>':'';

        container.innerHTML=bridgeStyle+result;
      } else {
        // Fallback: basic grid (retro-compat when template is null)
        var html='<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        for(var i=0;i<articles.length;i++){
          var a=articles[i];
          var img=a.cover_image_url?'<img src="'+a.cover_image_url+'" alt="'+a.title+'" class="w-full h-48 object-cover"/>':'<div class="w-full h-48 bg-gray-200 flex items-center justify-center"><span class="text-gray-400">Blog</span></div>';
          html+='<a href="?slug='+a.slug+'" class="block bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden">';
          html+=img;
          html+='<div class="p-4">';
          if(a.keyword) html+='<span class="text-xs font-medium text-blue-600 uppercase">'+a.keyword+'</span>';
          html+='<h3 class="mt-1 text-lg font-semibold line-clamp-2">'+(a.title||a.slug)+'</h3>';
          if(a.meta_description) html+='<p class="mt-1 text-sm text-gray-600 line-clamp-2">'+a.meta_description+'</p>';
          if(a.published_at_formatted) html+='<time class="mt-2 text-xs text-gray-400">'+a.published_at_formatted+'</time>';
          html+='</div></a>';
        }
        html+='</div>';
        container.innerHTML=html;
      }

      // Pagination
      if(total>limit){
        var pageCount=Math.ceil(total/limit);
        var nav=document.createElement("nav");
        nav.className="flex justify-center items-center gap-2 mt-8";
        if(page>1){
          var prev=document.createElement("a");
          prev.href="?page="+(page-1)+(catFilter?"&category="+encodeURIComponent(catFilter):"");
          prev.className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50";
          prev.textContent="Precedent";
          nav.appendChild(prev);
        }
        for(var p=1;p<=pageCount;p++){
          var btn=document.createElement("a");
          btn.href="?page="+p+(catFilter?"&category="+encodeURIComponent(catFilter):"");
          btn.className="px-3 py-1.5 border rounded text-sm"+(p===page?" bg-gray-900 text-white":" hover:bg-gray-50");
          btn.textContent=String(p);
          nav.appendChild(btn);
        }
        if(page<pageCount){
          var next=document.createElement("a");
          next.href="?page="+(page+1)+(catFilter?"&category="+encodeURIComponent(catFilter):"");
          next.className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50";
          next.textContent="Suivant";
          nav.appendChild(next);
        }
        container.appendChild(nav);
      }
    })
    .catch(function(err){
      container.innerHTML='<p style="text-align:center;color:#ef4444;padding:2rem 0">Erreur lors du chargement des articles</p>';
      console.error("Blog listing error:",err);
    });
})();
(function(){
  var bpId="646759cb-dee2-4fa6-b697-d9345eaf1037";
  var container=document.getElementById("blog-article");
  if(!container) return;

  var params=new URLSearchParams(window.location.search);
  var slug=params.get("slug");
  if(!slug){
    container.innerHTML='<p style="text-align:center;color:#9ca3af;padding:2rem 0">Aucun article selectionne</p>';
    return;
  }

  container.innerHTML='<div style="display:flex;align-items:center;justify-content:center;padding:3rem 0"><div style="height:1.5rem;width:1.5rem;border:2px solid #d1d5db;border-top-color:#2563eb;border-radius:50%;animation:ba-spin 1s linear infinite"></div></div><style>@keyframes ba-spin{to{transform:rotate(360deg)}}</style>';

  fetch("https://zgmrpjtpvloizvlfewuq.supabase.co/functions/v1/blog-data?endpoint=article&blogProjectId="+bpId+"&slug="+slug)
    .then(function(r){return r.json()})
    .then(function(data){
      var a=data.article;
      if(!a){
        container.innerHTML='<p style="text-align:center;color:#ef4444;padding:2rem 0">Article introuvable</p>';
        return;
      }
      var html='<article class="max-w-3xl mx-auto">';
      if(a.cover_image_url) html+='<img src="'+a.cover_image_url+'" alt="'+a.title+'" class="w-full rounded-lg mb-6"/>';
      html+='<header class="mb-6">';
      if(a.category) html+='<span class="text-sm font-medium text-blue-600 uppercase">'+a.category+'</span>';
      html+='<h1 class="text-3xl font-bold mt-2">'+(a.title||a.slug)+'</h1>';
      html+='<div class="flex items-center gap-2 mt-2 text-sm text-gray-500">';
      if(a.published_at) html+='<time>'+new Date(a.published_at).toLocaleDateString("fr-FR")+'</time>';
      html+='</div></header>';
      html+='<div class="prose max-w-none">'+(a.html_content||'')+'</div>';
      html+='</article>';
      var sameCat=data.sameCategoryArticles||[];
      var related=data.relatedArticles||[];
      var seen={};var combined=[];
      for(var j=0;j<sameCat.length;j++){if(!seen[sameCat[j].id]){seen[sameCat[j].id]=1;combined.push(sameCat[j]);}}
      for(var k=0;k<related.length;k++){if(!seen[related[k].id]&&combined.length<6){seen[related[k].id]=1;combined.push(related[k]);}}
      if(combined.length>0){
        html+='<aside class="mt-12"><h2 class="text-xl font-bold mb-4">Articles similaires</h2>';
        html+='<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
        for(var i=0;i<combined.length;i++){
          var r=combined[i];
          html+='<a href="?slug='+r.slug+'" class="block p-4 border rounded-lg hover:shadow transition">';
          if(r.cover_image_url) html+='<img src="'+r.cover_image_url+'" alt="'+r.title+'" class="w-full h-32 object-cover rounded mb-2"/>';
          html+='<h3 class="font-semibold">'+(r.title||r.slug)+'</h3></a>';
        }
        html+='</div></aside>';
      }
      html+='<div class="mt-8"><a href="?" class="text-blue-600 hover:underline">Retour aux articles</a></div>';
      container.innerHTML=html;
    })
    .catch(function(err){
      container.innerHTML='<p style="text-align:center;color:#ef4444;padding:2rem 0">Erreur lors du chargement de l\'article</p>';
      console.error("Blog article error:",err);
    });
})();