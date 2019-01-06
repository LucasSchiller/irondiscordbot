// Load up the discord.js library
const Discord = require("discord.js");

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

const adminroles = ['Officer', 'Guildmaster']

const Enmap = require('enmap');
const myEnmap = new Enmap();

myEnmap.set("waitingMembers", []);

// Here we load the config.json file that contains our token and our prefix values.
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

// Create an event listener for new guild members
client.on('guildMemberAdd', member => {
  // Send the message to a designated channel on a server:
  const channel = member.guild.channels.find(ch => ch.name === 'general-discussion');
  // Do nothing if the channel wasn't found on this server
  if (!channel) return;
  // Send the message, mentioning the member
  channel.send(`Welcome to IronBorn ${member.user}! If you are interested in joining our guild, please type !join in the general text channel to get into contact with an officer or guildmaster.`);
});


client.on("message", async message => {
  let guild = client.guilds.get('409155141103779841')

  // let new_member_channel = guild.channels.get('530177783423303680');
  let new_member_channel = guild.channels.find(ch => ch.name === 'new-member-invites')
  let guild_general_channel = guild.channels.find(ch => ch.name === 'guild-general-discussion')

  let gmRoleObject = guild.roles.find('name', 'Guildmaster')
  let officerRoleObject = guild.roles.find('name', 'Officer')

  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot) return;

  // Also good practice to ignore any message that does not start with our prefix,
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;

  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // Let's go with a few common example commands! Feel free to delete or change those.

  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }

  if(command === "waiting") {
    if(!message.member.roles.some(r=>adminroles.includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    waiting_users = myEnmap.get('waitingMembers')
    if (waiting_users.length < 1) {
      message.channel.send('No waiting users!')
      return;
    }
    let str_waiting_users = ''
    waiting_users.forEach(function(element) {
      str_waiting_users += `${element} `;
    });
    message.channel.send(`Users waiting to be contacted: ${str_waiting_users}`)
  }

  if(command === "join") {
    const waiting_users = myEnmap.get('waitingMembers')
    match = false
    waiting_users.forEach(function(element) {
      if (message.author.username === element) {
        match = true
        message.author.send("We have already submitted your request to contact an officer/GM. Please be patient.")
        message.delete(1);
        return;
      }
    });
    if (!match) {
      new_member_channel.send(`${officerRoleObject} ${gmRoleObject} ${message.author} has expressed interest in joining IRON. Please contact him at your earliest convenience. Make sure to mark him contacted with "!contacted <username>" so we dont get duplicate contacts.`);

      myEnmap.push('waitingMembers', message.author.username)
      message.author.send("We have submitted your request to the guild leaders about joining our ranks. They will contact you as soon as possible.")
      message.delete(1);
    }
  }

  if(command === "contacted") {
    if(!message.member.roles.some(r=>adminroles.includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    username = args[0]
    if (!username) {
      message.channel.send(`Please provide the username of the person you are contacting "!contacted <username>"`);
    } else {
      const waiting_users = myEnmap.get('waitingMembers')
      match = false
      waiting_users.forEach(function(element) {
        if (username === element) {
          match = true
          myEnmap.remove("waitingMembers", username);
          message.channel.send(`${message.author} has contacted ${username} about joining.`);
        }
      });
      if (!match) {
        message.channel.send(`${username} is not in the list of people waiting to be contacted, are you sure you spelled it correctly?`);
      }
    }
  }

  if(command === "say") {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use.
    // To get the "message" itself we join the `args` back into a string with spaces:
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{});
    // And we get the bot to say the thing:
    message.channel.send(sayMessage);
  }

  if(command === "promote") {
    if(!message.member.roles.some(r=>adminroles.includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");

    if(!guild_general_channel) {
      console.log('Cannot find channel')
    }

    let role = message.guild.roles.find(r => r.name === args[1]);

    // Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
    let member = message.mentions.members.first();

    // Add the role!
    member.addRole(role).catch(console.error);
    guild_general_channel.send(`@here Congratulations to ${message.mentions.members.first()} for being promoted to: ${role.name}`);
    message.delete(1);
    // Remove a role!
    // member.removeRole(role).catch(console.error);

  }

  if(command === "kick") {
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() to understand this bit:
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
    if(!message.member.roles.some(r=>adminroles.includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");

    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    // We can also support getting the member by ID, which would be args[0]
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.kickable)
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");

    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No reason provided";

    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
    message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

  }

  if(command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)
    if(!message.member.roles.some(r=>adminroles.includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");

    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.bannable)
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No reason provided";

    await member.ban(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }

  if(command === "purge") {
    if(!message.member.roles.some(r=>adminroles.includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    // This command removes all messages from all users in the channel, up to 100.

    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);

    // Ooooh nice, combined conditions. <3
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({limit: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }

  if(command === "help") {
    let contents = '';

    contents += '[IRON] LoA Bot:\n';
    contents += '\n';
    contents += '`' + config.prefix + 'help`- Shows this\n';
    contents += '`' + config.prefix + 'ping`- Prints \'pong with latency\'\n';
    contents += '`' + config.prefix + 'say <text>` - Tells the bot to type something on your behalf\n';
    contents += '`' + config.prefix + 'waiting` - Shows the users who are waiting to be contacted about recruitment. (Officer/GM Only)\n';
    contents += '`' + config.prefix + 'join` - Contacts the officers/gms expressing interest in joining IRON and adds user to the waiting to be contacted users list.\n';
    contents += '`' + config.prefix + 'contacted <username>` - Takes the user off of the waiting users list. (Officer/GM Only)\n';
    contents += '`' + config.prefix + 'promote <@user> <role>` - Promotes the tagged user to the specified role. (Officer/GM Only)\n';
    contents += '`' + config.prefix + 'kick <@user> <optional reason>` - Kicks the user tagged from the guild. (Officer/GM Only)\n';
    contents += '`' + config.prefix + 'ban <@user> <optional reason>` - Bans the user tagged from the guild. (Officer/GM Only)\n';
    contents += '`' + config.prefix + 'purge <1-100>` - Deletes the last X number of posts in the channel. (Officer/GM Only)\n';

    message.channel.send(contents);
  }


});

client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.on("debug", (e) => console.info(e));

client.login(config.token);
