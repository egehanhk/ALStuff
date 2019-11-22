function load_party_list() {
    const party_list_path = "https://raw.githubusercontent.com/egehanhk/ALStuff/master/gcta/gcta_groups.js";

    return new Promise((resolve, reject) => {
        const load_time = new Date();

        // Append code to document
        const append_script = (code_text) => {
            const library = document.createElement("script");
            library.type = "text/javascript";
            library.text = code_text;
            library.onerror = reject;
            document.getElementsByTagName("head")[0].appendChild(library);
        }

        const xhrObj = new XMLHttpRequest();
        xhrObj.open('GET', party_list_path, true);
        xhrObj.onload = function (e) {
            if (xhrObj.readyState === 4) {
                if (xhrObj.status === 200) {
                    append_script(xhrObj.responseText);
                    game_log("Party list loaded. " + mssince(load_time) + " ms", "gray");
                    resolve();
                } else {
                    reject();
                }
            }
        }
        xhrObj.onerror = reject;
        xhrObj.send(null); // This is what initates the request
    })
}

load_party_list();

// Handles incoming players list
function players_handler(event) {
    parent.player_list = event; // Party checking is done on this list
}

// Register event
parent.socket.on("players", players_handler);

// Request player list
setInterval(()=>{parent.socket.emit("players");}, 10000);


setInterval(()=>{
    // Find parties nearby and lonely dudes
    const parties_available = [];
    const loners = [];
    const process_player = (player) => {
        if (player.name in party_list) {
            if (player.party && character.party !== player.party) {
                // If they are in another party
                parties_available.push(player.party);
            } else if (!player.party) {
                // If they are not in party
                loners.push(player.name);
            }
        }
    }
    if (parent.player_list) { // Server player list available
        for (const player of parent.player_list) {
            process_player(player);
        }
    } else {
        for (const name in party_list) {
            if (name in parent.entities) {
                const player = parent.entities[name];
                process_player(player);
            }
        }
    }
    
    // Sort parties_available and join the alphabetically first party
    if (character.party) parties_available.push(character.party);
    parties_available.sort();
    if (parties_available.length && parties_available[0] !== character.party) {
        game_log("Left party to join " + parties_available[0] + "'s party", "gray");
        leave_party();
        send_party_request(parties_available[0]);
    }
    else if (loners.length) {
        // If not joining another party, send invites to characters not in party
        for (const i in loners) {
            send_party_invite(loners[i]);
        }
    }
}, 10000);

// For combining functions like on_destroy, on_party_invite, etc.
function combine_functions(fn_name, new_function) {
    if (!window[fn_name + "_functions"]) {
        window[fn_name + "_functions"] = [];
        if (window[fn_name]) {
            window[fn_name + "_functions"].push(window[fn_name]);
        }
        window[fn_name] = function () {
            window[fn_name + "_functions"].forEach((fn) => fn.apply(window, arguments));
        }
    }
    window[fn_name + "_functions"].push(new_function);
}

// Deregister event on code close
combine_functions("on_destroy", function() {
    parent.socket.removeListener("players", players_handler);
    delete parent.player_list;
});

combine_functions("on_party_invite", function(name) {
    if (name in party_list) {
        accept_party_invite(name);
    }
});

combine_functions("on_party_request", function(name) {
    if (name in party_list) {
        accept_party_request(name);
    }
});