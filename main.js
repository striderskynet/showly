
let local_api_path = "http://home.local/proyects/tv/api"
let image_path = "https://image.tmdb.org/t/p/w300_and_h450_bestv2";
let image_path_500 = "https://image.tmdb.org/t/p/w500";
let tmdb_options = {method: 'GET',headers: {accept: 'application/json', Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiMTdiOTBhNTE4N2I2ZGQyMDYwNDA2YTk0YmUzY2Y0MSIsInN1YiI6IjY0ODdiODI1ZTI3MjYwMDBjOTMxZDQ2NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.E-YGCzw4sOaRfJM-sM40r88ZFZbrelCImRqdDsmtttU'}};

let storage_name = "showly_database";
let database = Object();
let page = 1;
let cardNum = 1;
let tmdb_header = tmdb_options.headers;
let showlist = Array();
let container_width = Number(getComputedStyle(document.documentElement).getPropertyValue('--cardWidth').replace("px", ""));
let container_height= Number(getComputedStyle(document.documentElement).getPropertyValue('--cardHeight').replace("px", ""));
let requestTimer = true;

let copy_container = $("#default_container").clone();
let copy_loader = $("#default_loader").clone();

$("#default_container").remove();
$("#default_loader").remove();
$("#load-more-btn").remove();

function canRequest(){
    if (requestTimer) {
        requestTimer = false;
            setTimeout(function(){
                requestTimer = true;
            }, 2000);
        return true;
    } 
    return false
}

const getYearFromDate = (date) => {
    const d = new Date(date);
    let year = d.getFullYear();

    return year;
}

const infinityScroll = () => {
    
    if ($(window).scrollTop() >= $(document).height() - ($(window).height() * 2)) {
        if (page <= 50) {
            page++;
            
            let url = window.location.href.split("#");
            switch (url[1]) {
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

Date.prototype.dayOfYear= function(){
    var j1= new Date(this);
    j1.setMonth(0, 0);
    return Math.round((this-j1)/8.64e7);
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
        //width: "80vw",
    
        placeholder: 'Search for a show',
        minimumInputLength: 5,
            templateResult: formatShow,
            //templateSelection: formatRepoSelection,
        });
    
    function formatShow (show) {
        if (show.loading) return show.text;
    
        ( show.origin_country.length == 0) ? origin_country_div = "" : origin_country_div =  `<div class='select2-result-tv network'>(${show.origin_country})</div>`;
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
    Object.keys(obj).forEach(el => {
        count++;
    });
    return count;
}

async function loadShowsfromDB(display = true){
    let temp_db = window.localStorage.getItem(storage_name);
    (temp_db === null) ? database = new Object() : database = JSON.parse(temp_db);

    if (display == true) $(".hero-container").html(copy_loader.html()), displayShows(database), $(".hero-container").html("");

    return database
}

async function loadTrendingShows(reload = false){
    if (!reload)  $(".hero-container").html(copy_loader.html());
    //fetch('https://api.themoviedb.org/3/tv/popular?language=en-US&page=1', tmdb_options)
    fetch(`https://api.themoviedb.org/3/trending/tv/week?language=en-US&page=${page}`, tmdb_options)
    .then(response => response.json())
    .then(async response => {
        database = await loadShowsfromDB(false);

        const arr = Array();
        Object.values(database).forEach(el => {
            arr.push(el);
        })

        if (!reload) $(".hero-container").html(""), $(window).scroll(infinityScroll);
        response.results.forEach(val => {
            if ( !arr.includes(String(val.id))) createCard(val, true);
        })

        
    });
}

function joinDate(t, a, s) {
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

    fetch(`https://api.themoviedb.org/3/discover/tv?first_air_date.gte=${weekAgo}&include_adult=false&include_null_first_air_dates=false&language=en-US&page=${page}&sort_by=popularity.desc&with_origin_country=US&with_original_language=en`, tmdb_options)
    .then(response => response.json())
    .then(async response => {
        database = await loadShowsfromDB(false);

        const arr = Array();
        Object.values(database).forEach(el => {
            arr.push(el);
        })

        if (!reload) $(".hero-container").html(""), $(window).scroll(infinityScroll);
        response.results.forEach(val => {
            //console.log("Show id: ", val.id, " poster_path: ", val.poster_path);
            if ( !arr.includes(String(val.id)) && val.poster_path != null) createCard(val, true, false);
        })

    });
}

const displayShows = async (data) => {
    $(".hero-container").html(copy_loader.html());
    showlist = Array();
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
        showlist.forEach(function (el) {
            createCard(el);
        })
    });
}

function createCard(data, add = false, ret = false){

    let nc = copy_container.clone();
    $(nc).removeClass("d-none");
    $(nc).blur();
    $(nc).attr("id", "show-" + data.id);

    if (cardNum % 10 == 0 ) {
        $(nc).css("width", ( $(".main-container").width() * 3 ) + "px");
       // $('.ticket__movie-overview', nc).css("width", ( container_width * 3 ) + "px");
       // $('.ticket__movie-overview', nc).css("height", ( container_height * 1 ) + "px");
        (data.backdrop_path) ? $('img', nc).attr("src", image_path_500 + data.backdrop_path) : $('img', nc).attr("src", "./assets/images/default_poster.png");
    } else {
        (data.poster_path) ? $('img', nc).attr("src", image_path + data.poster_path) : $('img', nc).attr("src", "./assets/images/default_poster.png");
    }
    
    if (add) {
        $('.watchlist-ribbon__icon > i').removeClass().addClass("bi bi-plus-circle-fill");
        $('.watchlist-ribbon', nc).attr("onclick", `addShow(${data.id})`);
        $('.ticket__movie-network', nc).remove();
        $('.ticket__movie-details', nc).html(data.overview);
        $('.ticket__movie-episodedata', nc).html(data.first_air_date);
        $('.ticket__movie-next', nc).html(`<i class="bi bi-star-fill"></i> ` + Math.round(data.vote_average * 10) / 10 );
        
    } else {
        /*$('.hero-container.blocks .watchlist-ribbon').hover( function(){
            $('.watchlist-ribbon__bg').css("fill", "red")
        })*/
        $('.watchlist-ribbon__icon > i', nc).removeClass();//.addClass("bi bi-dash-circle-fill");
        $('.watchlist-ribbon__icon > i', nc).addClass("bi bi-dash-circle-fill");
        $('.watchlist-ribbon', nc).attr("onclick", `removeShow(${data.id})`);
        
        if ( data.networks !== undefined ) $('.ticket__movie-network', nc).html(data.networks[0].name);
        (data.next_episode_to_air !== null) ? $('.ticket__movie-episodedata', nc).html(`S${data.next_episode_to_air.season_number}.E${data.next_episode_to_air.episode_number} | ${data.next_episode_to_air.name}`) : $('.ticket__movie-episodedata', nc).html(data.last_episode_to_air.air_date);
        (data.next_episode_to_air !== null) ? $('.ticket__movie-next', nc).html(daysDiff(data.next_episode_to_air.air_date)) : $('.ticket__movie-next', nc).html("Completed").addClass("bg-primary");
        
    }
    
    $('.ticket__movie-overview', nc).html(data.overview);
    $('.ticket__movie-popularity', nc).html(data.vote_average);
    $('.ticket__movie-title', nc).html(data.name);
    $('.ticket__movie-date', nc).html(getYearFromDate(data.first_air_date));
    (data.number_of_seasons) ? $('.ticket__movie-completed', nc).html(`<strong>${data.number_of_seasons}</strong> Seasons`) : $('.ticket__movie-completed', nc).remove(); 

    if (ret == true) return nc;

    $(".hero-container").append(nc);
    $(nc).show();

    cardNum++;
}

function daysDiff(endDate, rText = true){
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

const removeShow1 = (id) => {
    console.log("Remove show: ", id);

    fetch(local_api_path + "?method=delete&id=" + id)
    .then((response) => response.json())
    .then((response) => { $(`#show-${id}`).remove(); })
    .catch(err => console.error(err));

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

function activeMenu(url){
    let active = "home";
    if ( url !== "" ) {
        url = url.replace("/", "");
        active = url;
    }

    $(".navbar-nav li a").removeClass("active");
    $(".navbar-nav li #" + active).addClass("active");

    console.log("Loading: ", active);
}

$( document ).ready(function(){
    loadShowsfromDB(false);
    //
    let url = window.location.href.split("#");

    switch(url[1]) {
        case "": case undefined: default:
            loadShowsfromDB(); url[1] = "";
            if (objectCount(database) == 0) {
                iziToast.info({
                    title: 'Showly',
                    message: `You currently have no shows, add shows in the search bar or in the trending/hot categories`,
                    position: `topCenter`,
                    transitionIn: `fadeInDown`, 
                    timeout: 15000,
                    displayMode: 2
                });
            }
            break;
        case "/trending": loadTrendingShows(); break;
        case "/hot": loadHotShows(); break;
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

    let url = e.newURL.split("#");

    switch(url[1]) {
        case "": default:
            loadShowsfromDB(); 
            if (objectCount(database) == 0) {
                iziToast.info({
                    title: 'Showly',
                    message: `You currently have no shows, add shows in the search bar or in the trending/hot categories`,
                    position: `topCenter`,
                    transitionIn: `fadeInDown`, 
                    timeout: 15000, 
                    displayMode: 2
                });
            }
            break;
        case "/trending": loadTrendingShows(); break;
        case "/hot": loadHotShows(); break;
    }

    activeMenu(url[1]);
});

/* Button Actions */
$(".breadcrumb h2").click(function (){
    var toClass = $(this).children("i").data("mode");

    $(".hero-container").removeClass("blocks rows");
    $(".hero-container").addClass(toClass);

})

$(window).scroll(function () {
    if ($(window).scrollTop() >= ( $(window).height() * 0.5 ) ) {
        $("#scroll-top-button").fadeIn("slow");

        $("#top-bar-nav").addClass("position-fixed")
    } else {
        $("#scroll-top-button").fadeOut("slow");
        $("#top-bar-nav").removeClass("position-fixed");
    }
});

$("#scroll-top-button").click(function(){
    $(window).scrollTop(0);
});

$("#about_modal_link").on("click", function(){
        $("#about_modal").modal("show");
});