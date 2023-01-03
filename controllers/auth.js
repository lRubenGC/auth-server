const { response } = require('express');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt');

const registrarUsuario = async (req, res = response) => {

    const { name, email, password } = req.body;

    try {
            // Verificar el email
            const usuario = await Usuario.findOne({ email: email });
            if ( usuario ) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Ese email ya está en uso'
                });
            }

            // Crear usuario con modelo
            const dbUser = new Usuario( req.body );

            // Encriptar la contraseña por hash
            const salt = bcrypt.genSaltSync();
            dbUser.password = bcrypt.hashSync( password, salt );

            // Generar el JWT
            const token = await generarJWT( dbUser.id, name );
            // Crear usuario de DB
            await dbUser.save();

            // Generar la respuesta exitosa
            return res.status(201).json({
                ok: true,
                uid: dbUser.id,
                nombre: name,
                token: token,
                msg: 'Usuario creado con éxito'
            });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: "Por favor hable con el administrador",
        });
    } 

};

const loginUsuario = async (req, res = response) => {

    const { email, password } = req.body;

    try {

        const dbUser = await Usuario.findOne({ email });

        if ( !dbUser ) {
            return res.status(400).json({
                ok: false,
                msg: 'El correo no existe'
            });
        }

        // Confirmar si el password concuerda
        const validPassword = bcrypt.compareSync( password, dbUser.password );

        if ( !validPassword ) {
            return res.status(400).json({
                ok: false,
                msg: 'El password no es válido'
            })
        }

        // Generar el JWT
        const token = await generarJWT( dbUser.id, dbUser.name );

        // Respuesta del servicio
        return res.json({
            ok: true,
            uid: dbUser.id,
            name: dbUser.name,
            token: token
        })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        })
    }

};

const revalidarToken = async (req, res = response) => {

    const { uid, name } = req;
    const token = await generarJWT( uid, name );

    return res.json({
        ok: true,
        uid,
        name,
        token
    })
    
};



module.exports = {
    registrarUsuario,
    loginUsuario,
    revalidarToken
}