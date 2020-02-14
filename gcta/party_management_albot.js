const node_https = parent.require('https');

function get_party_list() {
    const party_list_path = "https://raw.githubusercontent.com/egehanhk/ALStuff/master/gcta/gcta_groups.json";

    return new Promise((resolve, reject) => {
        const load_time = new Date();

        const request = node_https.get(party_list_path, function(response) {
            response.on('data', function (data) {
                try {
                    const party_lists = JSON.parse(data);
                    resolve(party_lists);
                } catch (e) {
                    console.error(e);
                    reject();
                    return;
                }
                game_log("Party list loaded. " + (new Date().getTime() - load_time) + " ms", "gray");
                return;
           });
        });
    });
}

let party_list = {};
function update_party_list() {
    get_party_list().then((party_lists)=>{
        for (const group_name in party_lists) {
            if (character.name in party_lists[group_name]) {
                party_list = party_lists[group_name];
                break;
            }
        }
    }).catch(()=>{
        game_log("Error retrieveing party lists", "red");
    });
}

update_party_list();
setInterval(update_party_list, 3600000); // every hour

// Handles incoming players list
function players_handler(event) {
    parent.player_list = event; // Party checking is done on this list
}

// Register event
parent.socket.on("players", players_handler);

// Request player list
setInterval(()=>{parent.socket.emit("players");}, 10000);

// "players" event from server will attempt to run the function load_server_list(). This is to prevent error since it's not defined in albot
function load_server_list() {}

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

function on_party_invite(name) {
    if (name in party_list) {
        accept_party_invite(name);
    }
}

function on_party_request(name) {
    if (name in party_list) {
        accept_party_request(name);
    }
}