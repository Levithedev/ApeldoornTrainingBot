// -------------------- Imports --------------------
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// -------------------- Discord Bot --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel],
});

const PREFIX = '!';
const TRAINING_CHANNEL_ID = process.env.TRAINING_CHANNEL_ID;
const STAFF_ROLE_NAME = 'StaffTeam'; // naam van de role die dit mag gebruiken

client.once('ready', () => {
  console.log(`✅ Bot online als ${client.user.tag}`);
});

// Command om training aan te maken
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === `${PREFIX}maketraining`) {
    if (!message.guild) {
      return message.reply('❌ Dit command kan alleen in een server worden gebruikt.');
    }

    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => role.name === STAFF_ROLE_NAME)) {
      return message.reply('❌ Je hebt geen permissie om dit command te gebruiken.');
    }

    try {
      const dmChannel = await message.author.createDM();
      await dmChannel.send("We gaan een training aanmaken! Beantwoord de vragen één voor één.");

      const vragen = [
        { key: 'team', vraag: 'Wat is de Training Team naam?' },
        { key: 'host', vraag: 'Wie is de Host?' },
        { key: 'cohost', vraag: 'Wie is de Co-Host?' },
        { key: 'helpers', vraag: 'Wie zijn de Helper(s)?' },
        { key: 'type', vraag: 'Wat is het Type Training?' },
        { key: 'tijd', vraag: 'Wat is de Tijd?' },
        { key: 'datum', vraag: 'Wat is de Datum?' },
        { key: 'everyone', vraag: 'Wil je @everyone toevoegen? (ja/nee)' },
      ];

      const antwoorden = {};

      for (const v of vragen) {
        await dmChannel.send(v.vraag);

        const filter = m => m.author.id === message.author.id && !m.author.bot;
        const collected = await dmChannel.awaitMessages({ filter, max: 1 });
        antwoorden[v.key] = collected.first().content.toLowerCase();
      }

      let tekstbericht = '';
      if (antwoorden.everyone === 'ja' || antwoorden.everyone === 'y') {
        tekstbericht += '@everyone\n';
      }

      tekstbericht += 
`Training Team: ${antwoorden.team}
Host: ${antwoorden.host}
Co-Host: ${antwoorden.cohost}
Helper(s): ${antwoorden.helpers}
Type-Training: ${antwoorden.type}
Tijd: ${antwoorden.tijd}
Datum: ${antwoorden.datum}`;

      const trainingChannel = await client.channels.fetch(TRAINING_CHANNEL_ID);
      await trainingChannel.send(tekstbericht);

      await dmChannel.send('✅ Je training is aangemaakt en gestuurd naar het trainingskanaal!');

    } catch (error) {
      console.error(error);
      try { await message.author.send('❌ Er is iets fout gegaan bij het aanmaken van de training.'); } catch {}
    }
  }
});

// -------------------- Webserver voor UptimeRobot --------------------
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Bot is online! 🌐');
});

app.listen(PORT, () => {
    console.log(`🌐 Webserver draait op poort ${PORT}`);
});

// -------------------- Discord Login --------------------
client.login(process.env.TOKEN);
