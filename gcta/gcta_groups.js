const party_lists = {
    group_1: {
        Trexnamedted: 1,
        CrownMage: 1,
        CrownSpam: 1,
        Trexnamedtut: 1,
        Trexnamedtom: 1,
        CrownsAnal: 1,
    },
    group_2: {
        //Stabara: 1,
        //Zorp: 1,
        //Zurp: 1,
        Bjarny: 1,
        Eyllis: 1,
        Mufffin: 1,
        Bjarni: 1,
        Aran: 1,
        Zirp: 1,
        Nara: 1,
        Bjarne: 1,
        Shana: 1
    }
}

let party_list = {};

for (const group_name in party_lists) {
    if (character.name in party_lists[group_name]) {
        party_list = {...party_lists[group_name]};
        break;
    }
}
