import { error } from '@sveltejs/kit';


/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    console.log(params);
    return {
        pms:["www.aoos.com","localhost","aoos.com","nomen-team.netlify.app"]
    };
}

