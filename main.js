"use strict";
const export_show_path = "https://www.themoviedb.org/tv/";
const image_path = "https://image.tmdb.org/t/p/w300_and_h450_bestv2";
const image_path_500 = "https://image.tmdb.org/t/p/w500";
const tmdb_options = {method: 'GET',headers: {accept: 'application/json', Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiMTdiOTBhNTE4N2I2ZGQyMDYwNDA2YTk0YmUzY2Y0MSIsInN1YiI6IjY0ODdiODI1ZTI3MjYwMDBjOTMxZDQ2NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.E-YGCzw4sOaRfJM-sM40r88ZFZbrelCImRqdDsmtttU'}};

const storage_name = "showly_database";
let database = {};
let showlist = [];
let page = 1;
let max_page = 50;
let cardNum = 1;

let active_sorting = "popularity.desc";
let existing_sorting = [
    "popularity.asc",
    "popularity.desc",
    "revenue.asc",
    "revenue.desc",
    "primary_release_date.asc",
    "primary_release_date.desc",
    "vote_average.asc",
    "vote_average.desc",
    "vote_count.asc",
    "vote_count.desc"
]

const dropdown = $("#sorting_dropdown");
const dd_button = $("#sorting_dropdown > button");
const dd_menu = $("#sorting_dropdown > .dropdown-menu");
const dd_item = $("#sorting_dropdown > .dropdown-menu li").clone(); $("#sorting_dropdown > .dropdown-menu li").remove();
const copy_container = $("#default_container").clone();
const copy_loader = $("#default_loader").clone();
$("#default_container").remove();
$("#default_loader").remove();


const toast_config = {
    position: `topCenter`,
    transitionIn: `fadeInDown`,
    timeout: 15000,
    displayMode:  2
    }

const lg = "en";
const lang = {
    en: {
        main_title: "Showly",
        menu_myshows: "My shows", 
        menu_trending: "Trending", 
        menu_hot: "Hot & New", 

        search_placeholder: "Search for a show",

        show_addtitle: "Add show",
        show_deltitle: "Remove show",
        show_sharetitle: "Share the show with friends",
        show_seasons: "Seasons",
    }
}


Date.prototype.dayOfYear= function(){
    var j1= new Date(this);
    j1.setMonth(0, 0);
    return Math.round((this-j1)/8.64e7);
}

const setPageTitle = (title_text) => {
    document.title = `${lang[lg]["main_title"]} | ${title_text}`; 
} 

const getYearFromDate = (date) => {
    const d = new Date(date);
    let year = d.getFullYear();

    return year;
}

$("#main_search").select2({
    ajax: {
        url: "https://api.themoviedb.org/3/search/tv",
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiMTdiOTBhNTE4N2I2ZGQyMDYwNDA2YTk0YmUzY2Y0MSIsInN1YiI6IjY0ODdiODI1ZTI3MjYwMDBjOTMxZDQ2NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.E-YGCzw4sOaRfJM-sM40r88ZFZbrelCImRqdDsmtttU'
        },
        dataType: 'json',
        delay: 250,
            data: function (params) {
                return {query: params.term};
            },
            cache: true
        },
    
        placeholder: lang[lg]['search_placeholder'],
        minimumInputLength: 5,
            templateResult: formatShow,
            //templateSelection: formatRepoSelection,
        });
    
function formatShow (show) {
    if (show.loading) return show.text;

    let origin_country_div = "";
    if ( show.origin_country.length != 0) origin_country_div =  `<div class='select2-result-tv network'>(${show.origin_country})</div>`;
    ( show.poster_path === undefined) ? poster_path_div = "" : poster_path_div =  `<div class='select2-result-tv logo col-md-auto'><img loading='lazy' src='${image_path }${show.poster_path}'/></div>`;

    var container = $(
    "<div class='select2-result-shows row' onClick='select_show('>" + 
        poster_path_div +  
        `<div class='select2-result-tv-data col'><div class='select2-result-tv id'>${show.id}${origin_country_div}</div>` +
        `<div class='select2-result-tv show_name'>${show.name} - (${getYearFromDate(show.first_air_date)})</div>` +
    "</div></div>"
    );
    
    return container;
}

$('#main_search').on("select2:select", function(e) {
    $('#main_search').select2("val", "null");
    let show = e.params.data;

    if ( addShow(show.id) ) {
        fetch(`https://api.themoviedb.org/3/tv/${show.id}?language=en-US`, tmdb_options)
        .then(response => response.json())
        .then(response => {
            $(".hero-container").prepend(createCard(response, false, true));
        })
    }
});

const objectCount = (obj) => {
    let count = 0;
    Object.keys(obj).forEach(function (){count += 1});
    return count;
}

const loadShowsfromDB = async (display = true) => {
    let temp_db = window.localStorage.getItem(storage_name);
    (temp_db === null) ? database = {} : database = JSON.parse(temp_db);

    if (display === true) 
        $(".hero-container").html(copy_loader.html()), 
        displayShows(database), 
        $(".hero-container").html("");

    return database
}

const loadTrendingShows = async (reload = false) => {
    if (!reload)  $(".hero-container").html(copy_loader.html());
    //fetch('https://api.themoviedb.org/3/tv/popular?language=en-US&page=1', tmdb_options)
    fetch(`https://api.themoviedb.org/3/trending/tv/week?language=en-US&page=${page}&sort_by=${active_sorting}`, tmdb_options)
    .then(response => response.json())
    .then(async response => {
        database = await loadShowsfromDB(false);

        max_page = response.total_pages;
        const arr = [];
        Object.values(database).forEach(el => {
            arr.push(el);
        })

        if (!reload) $(".hero-container").html(""), $(window).scroll(infinityScroll);
        response.results.forEach(val => {
            if ( !arr.includes(String(val.id))) createCard(val, true);
        })

        
    });
}

const joinDate = (t, a, s) =>{
    function format(m) {
        let f = new Intl.DateTimeFormat('en', m);
        return f.format(t);
    }
    return a.map(format).join(s);
}

async function loadHotShows(reload = false){
    if (!reload)  $(".hero-container").html(copy_loader.html());
    $("#load-more-btn").remove();

    let weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    let dateFormat = [{year: 'numeric'}, {month: '2-digit'}, {day: '2-digit'}];
    weekAgo = joinDate(weekAgo, dateFormat, "-");
    // = "2023-6-10";


    let uri = `https://api.themoviedb.org/3/discover/tv?first_air_date.gte=${weekAgo}&include_adult=false&include_null_first_air_dates=false&language=en-US&page=${page}&sort_by=${active_sorting}&with_origin_country=US&with_original_language=en`;
    fetch(uri, tmdb_options)
    .then(response => response.json())
    .then(async response => {
        
        max_page = response.total_pages;
        database = await loadShowsfromDB(false);

        const arr = [];
        Object.values(database).forEach(el => {
            arr.push(el);
        })

        if (!reload) $(".hero-container").html(""), $(window).scroll(infinityScroll);
        response.results.forEach(val => {
            //console.log("Show id: ", val.id, " poster_path: ", val.poster_path);
            /*if ( !arr.includes(String(val.id)) && val.poster_path != null)*/ createCard(val, true, false);
        })

    });
}

const displayShows = async (data) => {
    $(".hero-container").html(copy_loader.html());
    showlist = [];
    var fetches = [];
    
    Object.values(data).forEach(el => {
        fetches.push(
            fetch(`https://api.themoviedb.org/3/tv/${el}?language=en-US`, tmdb_options)
            .then(response => response.json())
            .then(response => {
                let nextDays = null;
                (response.in_production && response.next_episode_to_air !== null) ? nextDays = daysDiff(response.next_episode_to_air.air_date, false) : nextDays = showlist.length + 1000;
                response.next_date = nextDays;
                showlist.push(response);
            })
        );
    })

    Promise.all(fetches).then(function() {
        showlist.sort((a, b) => {
            return a.next_date - b.next_date;
        });

        $(".hero-container").html("");
        showlist.forEach((el) => {
            createCard(el);
        })
    });
}

const infinityScroll = () => {
    
    if ($(window).scrollTop() >= $(document).height() - ($(window).height() * 2)) {
        if (page <= max_page) {
            page += 1;
            
            let url = window.location.href.split("#");
            if (url[1].split(":")[1])  url[1] = url[1].split(":")[0];

            switch (url[1]) {
                default: break;
                case "/trending":
                    loadTrendingShows(true);
                    break;
                case "/hot":   
                    loadHotShows(true);
                    break;
            }
        }
    }
}

const shareShow =  (id) => {
    console.log(export_show_path + id);
    console.log("Sharing:", id);

    try {
        navigator.clipboard.writeText(export_show_path + id);

        
    } catch (error) {
        console.log(error);

        iziToast.warning({
            title: 'Showly',
            message: `Cant copy show <strong>${id}</strong> URL to clipboard`
        });

        return false;
    }

    iziToast.sucess({
        title: 'Showly',
        message: `Show <strong>${id}</strong> URL copied to clipboard`
    });
}

const createCard = (data, add = false, ret = false) => {

    let nc = copy_container.clone();
    $(nc).removeClass("d-none");
    $(nc).blur();
    $(nc).attr("id", "show-" + data.id);
    
    if (cardNum % 10 == 0 && data.backdrop_path && $(window).width() > 500) {
        $(nc).css("width", (100 / 3.5) * 5 + "vw" );/*( $(".main-container").width() * 3 ) + "px")*/;
        $('img', nc).attr("src", image_path_500 + data.backdrop_path);
    } else {
        (data.poster_path) ? $('img', nc).attr("src", image_path + data.poster_path) : $('img', nc).attr("src", "./assets/images/default_poster.png");
    }

    $('img', nc).attr("alt", data.name);

    if (add) {
        $('.watchlist-ribbon__icon > i').removeClass().addClass("bi bi-plus-circle-fill");
        $('.watchlist-ribbon', nc).attr("onclick", `addShow(${data.id})`);//.attr("title", lang[lg]['show_addtitle']).tooltip();;
        tippy($('.watchlist-ribbon', nc)[0], {content: lang[lg]['show_addtitle']});
        $('.ticket__movie-network', nc).remove();
        $('.ticket__movie-episodedata', nc).html(data.first_air_date);
        $('.ticket__movie-next', nc).html(`<i class="bi bi-star-fill"></i> ` + Math.round(data.vote_average * 10) / 10 );
        
    } else {
        $('.watchlist-ribbon', nc).attr("onclick", `removeShow(${data.id})`);//.attr("title", lang[lg]['show_deltitle']).tooltip();
        tippy($('.watchlist-ribbon', nc)[0], {content: lang[lg]['show_deltitle']});
        $('.watchlist-ribbon__bg', nc).removeClass("watchlist-ribbon__bg").addClass("watchlist-ribbon__bg-remove");
        $('.watchlist-ribbon__icon > i', nc).removeClass().addClass("bi bi-dash-circle-fill");
        
        if ( data.networks !== undefined ) $('.ticket__movie-network', nc).html(data.networks[0].name);
        (data.next_episode_to_air !== null) ? $('.ticket__movie-episodedata', nc).html(`S${data.next_episode_to_air.season_number}.E${data.next_episode_to_air.episode_number} - ${data.next_episode_to_air.name}`) : $('.ticket__movie-episodedata', nc).html(data.last_episode_to_air.air_date);
        (data.next_episode_to_air !== null) ? $('.ticket__movie-next', nc).html(daysDiff(data.next_episode_to_air.air_date)) : $('.ticket__movie-next', nc).html("Completed").addClass("bg-primary");
    }

    tippy($('.share-ribbon', nc)[0], {content: lang[lg]['show_sharetitle']});
    $('.share-ribbon', nc).on("click",function(){shareShow(data.id)});
    $('.ticket__movie-overview', nc).html(data.overview);
    $('.ticket__movie-popularity', nc).html(data.vote_average);
    $('.ticket__movie-title', nc).html(data.name);

    (data.number_of_seasons) ? $('.ticket__movie-completed', nc).html(`<strong>${data.number_of_seasons}</strong> ${lang[lg]['show_seasons']}`) : $('.ticket__movie-completed', nc).remove(); 

    let url = window.location.href.split("#");
    if (!url[1]) url[1] = "";
    (url[1]) ? $('.ticket__movie-date', nc).html(data.first_air_date) : $('.ticket__movie-date', nc).html(getYearFromDate(data.first_air_date));

    if (ret === true) return nc;

    $(".hero-container").append(nc);
    $(nc).show();

    cardNum += 1;
}

const daysDiff = (endDate, rText = true) => {
    const date1 = new Date();
    
    const date2 = new Date(endDate);
    let date3 = (date2.dayOfYear() - date1.dayOfYear()) + 1;

    //if (date3 == -1) date3 = 0;
    if (!rText) return date3;
    if (date3 < -1) return `${date3} days ago`;
    if (date3 == -1) return `Yesterday`;
    if (date3 == 0) return `Today`;
    if (date3 == 1) return `Tomorrow`;
    if (date3 > 1) return `In ${date3} days`;

    //return date2.dayOfYear() - date1.dayOfYear();
}
const removeShow = (id) => {
    iziToast.warning({
        title: 'Showly',
        message: `Removed show ${id} from database`
    });

    console.log("Remove show: ", id);

    Object.keys(database).forEach(el => {
        if (id == Number(database[el])) {
            delete database[el];
            window.localStorage.setItem(storage_name, JSON.stringify(database));
            
            $(`#show-${id}`).remove();
        }
    });
}

const addShow = (id) => {
    console.log("Add show: ", Number(id));

    let exists = false;
    let q = 0;
    Object.keys(database).forEach(el => {
        q = el;
        if (id == Number(database[el])) {
            exists = true;
            console.log("Show ", Number(id), " already exist in the database: ", database);
        }
    });
    
    let url = window.location.href.split("#");
    if ( !url[1] == undefined || !url[1] == "") $(`#show-${id}`).remove();

    if ( !exists ) {
        database[Number(q) + 1] = String(id);
        window.localStorage.setItem(storage_name, JSON.stringify(database));

        iziToast.success({
            title: 'Showly',
            message: `Added show ${id} to database`
        });

        return true;
    }

    iziToast.warning({
        title: 'Showly',
        message: `Show ${id} is already in the database`
    });
    return false;
}

const activeMenu = (url) => {
    let active = "home";
    if ( url !== "" ) {
        active = url.replace("/", "");
    }

    $(".navbar-nav li a").removeClass("active");
    $(".navbar-nav li #" + active).addClass("active");

    console.log("Loading: ", active);
}

const noShowsInDatabase = () => {
    toast_config.title = 'Showly';
    toast_config.message = `You currently have no shows, add shows in the search bar or in the trending/hot categories`;

    iziToast.info(toast_config);
}

const loadSortDropdown = () => {
    let url = window.location.href.split("#");

    if (!url[1]) url[1] = "";
    if(!url[1].includes("/hot")) {
        dropdown.addClass("d-none");
        return false;
    }

    let route = url[1];
    if (url[1].split(":")[1]) {
        route = url[1].split(":")[0];
        active_sorting = url[1].split(":")[1];
    }

    dropdown.removeClass("d-none");
    dd_menu.html("");

    existing_sorting.map(el => {
        dd_item.children("a").removeClass("active");
        let asc_desc = el.split(".");

        if (el == active_sorting) dd_button.html(el), dd_item.children("a").addClass("active");
        dd_item.children("a").html(asc_desc[0]).attr("href", `#${route}:${el}`);
        
        if (asc_desc[1] == "asc") dd_item.children("a").prepend($(`<i class="bi bi-arrow-up me-3 text-success"></i>`));
        else dd_item.children("a").prepend($(`<i class="bi bi-arrow-down me-3 text-success"></i>`));
        
        dd_menu.append(dd_item.clone());
       // console.log(el);
    })
    //console.log(dropdown,dd_button,dd_menu,dd_item);
}

$( document ).ready(function(){
    loadShowsfromDB(false);
    loadSortDropdown();
    //
    let url = window.location.href.split("#");
    if (!url[1]) url[1] = "";
    if (url[1].split(":")[1])  url[1] = url[1].split(":")[0];

    switch(url[1]) {
        case "": case undefined: default:
            setPageTitle(lang[lg]["menu_myshows"]);
            loadShowsfromDB(); 
            url[1] = "";
            if (objectCount(database) == 0) noShowsInDatabase();
            break;
        case "/trending": loadTrendingShows();  setPageTitle(lang[lg]["menu_trending"]); break;
        case "/hot": loadHotShows(); setPageTitle(lang[lg]["menu_hot"]); break;
    }

    activeMenu(url[1]);
});

window.addEventListener('hashchange', function(e){
    if (e.newURL.includes("modal")) {
        e.preventDefault(); 
        return false;
    }

    page = 1;
    cardNum = 1;
    $(window).off("scroll", infinityScroll);
    loadShowsfromDB(false);
    loadSortDropdown();

    let url = e.newURL.split("#");
    if (url[1].split(":")[1])  url[1] = url[1].split(":")[0];
    
    switch(url[1]) {
        case "": default:
            setPageTitle(lang[lg]["menu_myshows"]);
            loadShowsfromDB(); 
            if (objectCount(database) == 0) noShowsInDatabase();
            break;
        case "/trending": loadTrendingShows(); setPageTitle(lang[lg]["menu_trending"]); break;
        case "/hot": loadHotShows(); setPageTitle(lang[lg]["menu_hot"]); break;
    }

    activeMenu(url[1]);
});

/* Button Actions */
$(".breadcrumb h2").click(function (){
    var toClass = $(this).children("i").data("mode");

    $(".hero-container").removeClass("blocks rows");
    $(".hero-container").addClass(toClass);
})

$(".search-button").click(function(){
    console.log( $(".search-form"));
    $(".search-form").toggle();
})

$(window).scroll(function () {
    let go = false;
    if ($(window).scrollTop() >= ( $(window).height() * 0.5 ) ) go = true;
    
    (go) ?  $("#scroll-top-button").fadeIn("slow") : $("#scroll-top-button").fadeOut("slow");

    if ($(window).width() <= 500 ) return false;

    (go) ? $("#top-bar-nav").addClass("position-fixed") : $("#top-bar-nav").removeClass("position-fixed")
});

$("#scroll-top-button").click(function(){
    $(window).scrollTop(0);
});

$("#about_modal_link").on("click", function(){
        $("#about_modal").modal("show");
});