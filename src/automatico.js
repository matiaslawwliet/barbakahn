const fs = require('fs');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');

const data = require('./data');

class Automatico {

    constructor() {
        this.timerModoAutomatico = new Map();
        this.timerModoAutomaticoFuncionando = new Map();
    }

    /** MÉTODOS */

    reproducirModoAutomatico(canales, audios, mensaje) {
        if(canales.length > 0) {
            setTimeout(async () => {
                let canal = canales.shift();
                try {
                    const connection = joinVoiceChannel({
                        channelId: canal.id,
                        guildId: canal.guild.id,
                        adapterCreator: canal.guild.voiceAdapterCreator
                    });
                    const player = createAudioPlayer();
                    const audio = audios[Math.floor(Math.random() * audios.length)];
                    const resource = createAudioResource('./audios/' + audio);
                    player.play(resource);
                    connection.subscribe(player);
                    player.on(AudioPlayerStatus.Idle, () => {
                        player.stop();
                        connection.destroy();
                        this.reproducirModoAutomatico(canales, audios, mensaje);
                    });
                    connection.on(VoiceConnectionStatus.Disconnected, () => {
                        connection.destroy();
                        this.reproducirModoAutomatico(canales, audios, mensaje);
                    });
                } catch (error) {
                    throw new Error("No pude reproducir el sonido rey, fijate los permisos del chanel bb");
                }
            }, 1000);
        } else {
            this.timerModoAutomaticoFuncionando.delete(mensaje.guild.shardID + '-' + mensaje.guild.id);
        }

    }

    ejecutarModoAutomatico(mensaje) {

        const canalesCache = mensaje.guild.channels.cache;
        let canales = [];

        const timerModoAutomaticoFuncionando = this.timerModoAutomaticoFuncionando.get(mensaje.guild.shardID + '-' + mensaje.guild.id);

        if(!timerModoAutomaticoFuncionando) {

            this.timerModoAutomaticoFuncionando.set(mensaje.guild.shardID + '-' + mensaje.guild.id, true);

            fs.readdir('./audios', (err, audios) => {

                //data.sonando.set(mensaje.guild.shardID + '-' + mensaje.guild.id, true);

                // LIMPIAMOS LOS CANALES QUE NO SON DE VOICE
                canalesCache.map( (canal, iCanal) => {

                    if(canal.type === 'voice' && canal.members.size > 0) {
                        canales.push(canal);
                    }
                });

                if(canales.length > 0) {
                    this.reproducirModoAutomatico(canales, audios, mensaje);
                } else {
                    this.modoAutomatico(false, [], mensaje);
                    mensaje.channel.send('Se desactivó el modo automático debido a que no hay ningún sv donde entrar');
                }

            });
        }

    }

    modoAutomatico(modo, args, mensaje) {

        return new Promise( async (success, failure) => {
            if(data.usuariosEscuchando.size !== 0) return failure('No se puede activar el modo automático si hay usuarios escuchando');

            if (modo) {

                const automatico = data.automatico.get(mensaje.guild.shardID + '-' + mensaje.guild.id);
                if(automatico) return failure('El modo automático ya está activado');

                let tiempo = 1800000; // MEDIA HORA EN MS

                // EL PRIMER ARGUMENTO ES CADA CUANTO TIEMPO SE VA A EJECUTAR
                if (args[0] !== undefined) {

                    if (!Number.isInteger(parseInt(args[0])) || parseInt(args[0]) < 1) return failure('El argumento del tiempo tiene que ser un número válido');

                    tiempo = parseInt(args[0]) * 1000 * 60;

                }

                data.automatico.set(mensaje.guild.shardID + '-' + mensaje.guild.id, true);

                this.timerModoAutomatico.set(mensaje.guild.shardID + '-' + mensaje.guild.id, setInterval(this.ejecutarModoAutomatico.bind(this), tiempo, mensaje));

                success('El modo automático fue activado');

            } else {

                const automatico = data.automatico.get(mensaje.guild.shardID + '-' + mensaje.guild.id);
                if (!automatico) return failure('El modo manual ya está desactivado');

                data.automatico.delete(mensaje.guild.shardID + '-' + mensaje.guild.id);
                this.timerModoAutomaticoFuncionando.delete(mensaje.guild.shardID + '-' + mensaje.guild.id);
                clearInterval(this.timerModoAutomatico.get(mensaje.guild.shardID + '-' + mensaje.guild.id));

                success('El modo automático fue desactivado');
            }
        });
    }

    /** END MÉTODOS */
}

const automatico = new Automatico();

module.exports = automatico;