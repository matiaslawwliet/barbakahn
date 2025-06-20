const data = require('./data');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { GuildMember } = require('discord.js');

class Sonido {

    constructor() {
        this.colaSonidos = new Map();
    }

    /** METODOS */

    agregarCola(comando, mensaje) {

        return new Promise( async (success, failure) => {
            const sonido = {
                comando: comando,
                mensaje: mensaje,
            };

            let cola = this.colaSonidos.get(mensaje.guild.shardID + '-' + mensaje.guild.id);
            if(!cola || cola.length === 0) {
                this.colaSonidos.set(mensaje.guild.shardID + '-' + mensaje.guild.id, [sonido]);
            } else {
                cola.push(sonido);
                this.colaSonidos.set(mensaje.guild.shardID + '-' + mensaje.guild.id, cola);
            }

            try {
                this.reproducirSonido(mensaje);
            } catch (err) {
                return failure(err.message);
            }

            success('Sonido agregado a la lista');
        });

    }

    reproducirSonido(mensaje) {
        const sonando = data.sonando.get(mensaje.guild.shardID + '-' + mensaje.guild.id);
        if(!sonando) {
            let cola = this.colaSonidos.get(mensaje.guild.shardID + '-' + mensaje.guild.id);
            const sonido = cola.shift();
            this.colaSonidos.set(mensaje.guild.shardID + '-' + mensaje.guild.id, cola);
            if(sonido !== undefined) {
                const voiceChannel = sonido.mensaje.member.voice.channel;
                if (voiceChannel) {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: voiceChannel.guild.id,
                        adapterCreator: voiceChannel.guild.voiceAdapterCreator
                    });
                    const player = createAudioPlayer();
                    const resource = createAudioResource('./audios/' + sonido.comando + '.mp3');
                    player.play(resource);
                    connection.subscribe(player);
                    data.sonando.set(mensaje.guild.shardID + '-' + mensaje.guild.id, true);
                    player.on(AudioPlayerStatus.Idle, () => {
                        data.sonando.delete(mensaje.guild.shardID + '-' + mensaje.guild.id);
                        let cola = this.colaSonidos.get(mensaje.guild.shardID + '-' + mensaje.guild.id);
                        if(cola.length > 0) {
                            this.reproducirSonido(mensaje);
                        } else {
                            this.colaSonidos.delete(mensaje.guild.shardID + '-' + mensaje.guild.id);
                            if(data.usuariosEscuchando.size === 0) {
                                connection.destroy();
                            }
                        }
                    });
                    connection.on(VoiceConnectionStatus.Disconnected, () => {
                        data.sonando.delete(mensaje.guild.shardID + '-' + mensaje.guild.id);
                        connection.destroy();
                    });
                }
            }
        }
    }

    /** END MÉTODOS */
}

const sonido = new Sonido();

module.exports = sonido;