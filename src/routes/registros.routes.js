import express from 'express';
import { Paquete } from '../models/Paquete.js';
import { Registro } from '../models/Registro.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// index

router.get('/', verifyToken, (req, res) => {
    res.render('index');
});


// registros

router.get('/ver-registros', verifyToken, async (req, res) => {
    try {
        const registrosExistentes = await Registro.findAll();
        const datosPaquetesPadre = await Promise.all(
            registrosExistentes.map(async (registro) => {
                return await Paquete.findByPk(registro.id_paquete);
            })
        );

        res.render('partials/registros/ver-registros', {
            registros: registrosExistentes,
            datosPaquetesPadre: datosPaquetesPadre,
            helpers: {
                json: function (context) {
                    return JSON.stringify(context, null, 2);
                },
                eq: function (v1, v2) {
                    return v1 === v2;
                }
            }
        });
    } catch (error) {
        console.error('Error al buscar registros:', error);
        res.status(500).send('Error al buscar registros');
    }
});

router.get('/crear-registro', verifyToken, async (req, res) => {
    try {
        const paquetesExistentes = await Paquete.findAll();
        res.render('partials/registros/crear-registro', {
            paquetes: paquetesExistentes
        })
    } catch (error) {
        console.error('Error al abrir vista crear-registro:', error);
        res.status(500).send('Error al abrir vista crear-registro');
    }
});

router.post('/crear-registro', verifyToken, async (req, res) => {
    console.log('Datos recibidos:', req.body);
    try {
        const {
            id_paquete,
            alto,
            ancho,
            espesor,
            especie,
            cantidad,
            total_metros_cubicos,
            total_pies_tablares
        } = req.body;

        if (!id_paquete || !alto || !ancho || !espesor || !especie ||
            !cantidad || !total_metros_cubicos || !total_pies_tablares) {
            console.log('Faltan campos requeridos');
            return res.status(400).send('Todos los campos son requeridos');
        }

        const cantidadNum = parseInt(cantidad);
        if (isNaN(cantidadNum) || cantidadNum < 1) {
            return res.status(400).send('La cantidad debe ser un número positivo');
        }

        const registrosCreados = [];

        for (let i = 0; i < cantidadNum; i++) {
            const nuevoRegistro = await Registro.create({
                id_paquete,
                alto: parseFloat(alto),
                ancho: parseFloat(ancho),
                espesor: parseFloat(espesor),
                especie,
                total_metros_cubicos: parseFloat(total_metros_cubicos),
                total_pies_tablares: parseFloat(total_pies_tablares)
            });
            registrosCreados.push(nuevoRegistro);
        }

        console.log(`${cantidadNum} registros creados exitosamente`);
        res.redirect('/ver-registros');

    } catch (error) {
        console.error('Error al crear los registros:', error);
        res.status(500).send('Error al crear los registros: ' + error.message);
    }
});

router.get('/eliminar-registro/:id', verifyToken, async (req, res) => {
    try {
        const registroID = req.params.id;

        await Registro.destroy({
            where: {
                id: registroID,
            },
        });

        res.redirect('/ver-registros');
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        res.status(500).send('Error al eliminar registro.');
    }
});

export default router;