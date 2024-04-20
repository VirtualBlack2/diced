// Made by Stratiz

// init project
const express = require('express');
const app = express();
const { Client, MessageEmbed } = require('discord.js');
let client = new Client();

//// IMPORTANT VVV
let token = process.env.SECRET //Your token goes in key.env (Discord bot)
let prefix = '!'; // Discord bot prefix
let rolename = "Staff"
/// IMPORTANT ^^^

async function startApp() {
    var promise = client.login(token)
    console.log("Starting...");
    promise.catch(function(error) {
      console.error("Discord bot login | " + error);
      process.exit(1);
    });
}
startApp();
client.on("ready", () => {
  console.log("Successfully logged in Discord bot.");
  
  client.user.setActivity('📦BloxDash', { type: 'PLAYING' })
    .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
    .catch(console.error);
});

const TookTooLong = new MessageEmbed()
  .setColor('#eb4034')
  .setDescription("You took too long to respond!")

async function createTicketChannel(message) {
  try {
    // Check if the message author is a bot
    if (message.author.bot) {
      return; // Ignore bot messages
    }

    // Check if the user has the specified role ID
    const allowedRoleID = '714616181075476480'; // Replace this with the desired role ID
    if (!message.member.roles.cache.has(allowedRoleID)) {
      return message.channel.send('You do not have the required role to use this command.');
    }

    // Create a new text channel
    const channel = await message.guild.channels.create(`ticket-${message.author.username}`, {
      type: 'text',
      parent: '1230026585659408396', // Specify the ID of the category where you want the ticket channels to be created
      permissionOverwrites: [
        {
          id: message.guild.roles.everyone, // Deny permissions for everyone
          deny: ['VIEW_CHANNEL']
        },
        {
          id: message.author.id, // Allow permissions for the user who created the ticket
          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        }
      ]
    });

    // Mention the Staff role
    const staffRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'staff');
    if (staffRole) {
      await channel.send(`${message.author} has created a ticket! ${staffRole}, please assist.`);
    } else {
      await channel.send(`${message.author} has created a ticket! Staff, please assist.`);
    }

    // Notify user about the successful creation of the ticket channel
    message.channel.send(`Ticket channel "${channel.name}" has been created successfully.`);
  } catch (error) {
    console.error('Error creating ticket channel:', error);
    message.channel.send('There was an error creating the ticket channel.');
  }
}

async function closeTicketChannel(message) {
  try {
    // Check if the user has the 'Staff' role
    const staffRoleName = 'Staff'; // Replace this with the actual role name
    if (!message.member.roles.cache.some(role => role.name === staffRoleName)) {
      return message.channel.send('You do not have the required role to use this command.');
    }

    // Check if the command is sent in a ticket channel
    if (!message.channel.name.startsWith('ticket-')) {
      return message.channel.send('This command can only be used in a ticket channel.');
    }

    // Ask for conclusion
    await message.channel.send('Please provide a conclusion for this ticket. What was the reason for closing it?');

    const filter = response => response.channel.id === message.channel.id && response.author.id === message.author.id;
    const collector = message.channel.createMessageCollector(filter, { time: 300000, max: 1 });

    console.log('Collector created');

    collector.on('collect', async response => {
      console.log('Message collected:', response.content);
      const conclusion = response.content;

      // Get user who opened the ticket
      const ticketOpener = message.channel.name.split('-')[1]; // Extract username from channel name

      // Send message with ticket details
      const ticketDetails = `Support Ticket conclusion: ${conclusion}`;
      
      // Send ticket details to ticket opener as a direct message
      const ticketOpenerUser = await message.guild.members.cache.find(member => member.user.username === ticketOpener);
      if (ticketOpenerUser) {
        const { MessageEmbed } = require('discord.js');
        const ticketEmbed = new MessageEmbed()
          .setColor('#00ff00')
          .setDescription(ticketDetails)
          .setFooter('| Diced Interactive |', message.client.user.displayAvatarURL())
          .addField('Ticket opened by', ticketOpener); // Add this line to include ticket opener's username
        await ticketOpenerUser.send(ticketEmbed);
      } else {
        console.error('Error: Ticket opener not found.');
      }

      // Send ticket details to specified channel using embed
      const logChannelID = '1230605878336421969'; // Replace with the desired channel ID
      const ticketChannel = message.guild.channels.cache.get(logChannelID);
      if (ticketChannel) {
        const ticketEmbed = new MessageEmbed()
          .setColor('#ff0000')
          .setTitle('Ticket Closed')
          .setDescription(ticketDetails)
          .addField('Ticket opened by', ticketOpener) // Add this line to include ticket opener's username
          .setTimestamp();
        await ticketChannel.send(ticketEmbed);
      } else {
        console.error('Error: Ticket log channel not found.');
      }

      // Delete the ticket channel
      await message.channel.delete();
      message.channel.send(`Ticket channel "${message.channel.name}" has been closed.`);
    });

    collector.on('end', collected => {
      console.log('Collector ended');
      if (collected.size === 0) {
        message.channel.send('You did not provide a conclusion within the time limit. Ticket closure cancelled.');
      }
    });
  } catch (error) {
    console.error('Error closing ticket channel:', error);
    message.channel.send('There was an error closing the ticket channel.');
  }
}


function isCommand(command, message) {
    var command = command.toLowerCase();
    var content = message.content.toLowerCase();
    return content.startsWith(prefix + command);
}

client.on('message', async (message) => {
  if(message.author.bot) return;
   if (message.member.roles.cache.some(role => role.name === rolename)) {
      const args = message.content.slice(prefix.length).split(' ');

      if (isCommand("Ticket", message)) { // Add this condition for the ticket command
        createTicketChannel(message);
      } else if (isCommand("Close", message)) { // Add this condition for the close command
        closeTicketChannel(message);
      }
    }
});

/////
app.use(express.static('public'));

// listen for requests & Keep bot alive

let listener = app.listen(process.env.PORT, function() {
    //setInterval(() => { // Used to work sometime ago
    //    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    //}, 280000);
    console.log('Not that it matters but your app is listening on port ' + listener.address().port);
});

client.on('error', console.error)
