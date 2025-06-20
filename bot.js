require('dotenv').config({path: __dirname + '/.env'});
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User]
});

const app = require('./src');

const prefix = 'b!';

// client.on('message', message => {
//
//     if (!message.content.startsWith(prefix) || message.author.bot) return;
//
//     const args = message.content.slice(prefix.length).trim().split(/ +/);
//     const command = args.shift().toLowerCase();
//
//     if (command === 'stats') {
//         return message.channel.send(`Server count: ${client.guilds.cache.size}`);
//     }
// });
//
// client.login(process.env['TOKEN']);

client.login(process.env['TOKEN']).then( () => {
    client.on('messageCreate', mensaje => {
        if (mensaje.content.includes(prefix)) {
            let args = [];
            let comando = mensaje.content.split(prefix)[1];
            if (/\s/.test(comando)) {
                args = comando.split(' ');
                comando = args.shift();
            }
            if (comando.length > 1) {
                leerComando(comando, args, mensaje).then( (res) => {
                    mensaje.reply(res);
                }).catch( (err) => {
                    mensaje.reply(err);
                });
            }
        }
    });

    client.on("ready", async () => {
        console.log("Barbakahn BOT by matiaslawwliet");
        console.log("Node Version: " + process.version);
        console.log("Discord.js Version: " + require('discord.js').version);

        client.shard.fetchClientValues('guilds.cache.size').then(results => {
            client.user.setActivity(results.reduce((acc, guildCount) => acc + guildCount, 0) + " servers "+ prefix +"ayuda", {type: "PLAYING"});
            // console.log(`${results.reduce((acc, guildCount) => acc + guildCount, 0)} total guilds`);
            }).catch(console.error);

        // const canalesCache = client.channels.cache;
        // canalesCache.map( (canal, iCanal) => {
        //
        //     if(canal.type === 'text') {
        //         client.channels.cache.get(canal.id).send('Ya estoy Online bitches!!!');
        //     }
        // });

        // await client.user.setActivity((client.guilds.cache.size).toString() + " servers "+ prefix +"help", {type: "PLAYING"});
    });

    client.on("guildCreate", async () => {

        client.shard.fetchClientValues('guilds.cache.size').then(results => {
            client.user.setActivity(results.reduce((acc, guildCount) => acc + guildCount, 0) + " servers "+ prefix +"ayuda", {type: "PLAYING"});
                // console.log(`${results.reduce((acc, guildCount) => acc + guildCount, 0)} total guilds`);
            }).catch(console.error);

        // await client.user.setActivity((client.guilds.cache.size).toString() + " servers "+ prefix +"help", {type: "PLAYING"});

    });


}).catch(console.error);

async function leerComando(comando, args, mensaje) {

    return new Promise( async (success, failure) => {

        if(mensaje.member.id !== client.user.id) {
            switch (comando) {
                case 'ayuda':
                    let msg = {
                        embeds: [{
                            color: 3447003,
                            title: "Barbakahn BOT",
                            description: "Si queres colaborar con el mantenimiento del bot, podés agregarme a Discord: https://discord.com/users/574120142896627713",
                            fields: [
                                {
                                    name:`${prefix}sonidos`,
                                    value:"Muestra los sonidos disponibles para reproducir."
                                },
                                {
                                    name:`${prefix}<frase>`,
                                    value:"Dice alguna frase de barba (Ej: b!wtf) (SÓLO FUNCIONA EN MODO MANUAL)"
                                },
                                {
                                    name:`${prefix}manual`,
                                    value:"El bot solo va a funcionar por comando."
                                },
                                {
                                    name:`${prefix}automatico <tiempo_en_minutos>`,
                                    value:"El bot va a ingresar a todos los channels cada X tiempo a reproducir un sonido al azar."
                                },
                                {
                                    name:`${prefix}escuchar`,
                                    value:"El bot va a escucharte cada 10 segundos, 3 segundos. Si decís una frase de Barba, el bot va a reproducir la frase sólo (Deshabilitado momentaneamente por cuestiones de escalabilidad)"
                                }
                            ],
                            footer: {
                                text:`Este bot está en: ${client.guilds.cache.size} servidores.`
                            }
                        }]
                    };
                    success(msg);
                    break;
                case 'automatico':
                    app.automatico.modoAutomatico(true, args, mensaje).then( (suc) => {
                        success(suc);
                    }).catch( (err) => {
                        failure(err);
                    });
                    break;
                case 'manual':
                    app.automatico.modoAutomatico(false, args, mensaje).then( (suc) => {
                        success(suc);
                    }).catch( (err) => {
                        failure(err);
                    });
                    break;

                case 'sonidos':

                    let audios = [];

                    await fs.readdir('./audios/', (err, archivos) => {

                        archivos.forEach(archivo => {
                            audios.push(archivo.replace('.mp3', ''));
                        });

                        success("Todos los sonidos que hay para reproducir son: " + audios.join(' - '));
                    });

                    break;

                case 'test':
                    break;

                //case 'escuchar': app.escuchar.agregarEscucha(mensaje);   break;

                default:

                    const voiceChannel = mensaje.member.voice.channel;

                    if (!voiceChannel) return failure('Veni chiquita, entra al canal de voz');
                    if (!fs.existsSync('./audios/' + comando + '.mp3')) failure('insiste la malezaaa!!!');

                    // SI ESTÁ EN MODO AUTOMÁTICO
                    const automatico = app.data.automatico.get(mensaje.guild.shardID + '-' + mensaje.guild.id);
                    if (automatico) return failure('El bot está en modo automático, desactivalo con '+ prefix +'manual');

                    app.sonidos.agregarCola(comando, mensaje).then( (suc) => {
                        success(suc);
                    }).catch( (err) => {
                        failure(err);
                    });

                    break;
            }
        }
    });
}
