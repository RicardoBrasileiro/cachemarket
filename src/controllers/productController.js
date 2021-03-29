const dbs = require('../config/database');

const { query, client } = dbs;

module.exports = {

    async index(req, res) {

        await query(
            'SELECT * FROM products ORDER BY p_name ASC'
        ).then(async (response) => {
            return res.status(200).send({ message: "Produtos retornados!", products: response.rows });
        }, (error) => {
            return res.status(400).send({ message: "Ocorreu um erro!", products: null });
        });
    },

    async show(req, res) {

        const { id } = req.params;

        client.get(id, async (err, reply) => {
            if (reply != null) {

                const value = JSON.parse(reply.toString());
                return res.status(200).send({ message: "Produto encontrado!", product: value });

            } else {

                await query(
                    'SELECT * FROM products WHERE code = $1',
                    [id]
                ).then(async (response) => {

                    if (response.rows[0]) {

                        const value = response.rows[0];
                        client.setex(id, (60 * 60), JSON.stringify(value));

                        return res.status(200).send({ message: "Produto encontrado!", product: value });

                    } else {

                        return res.status(404).send({ message: "Produto não encontrado!", product: null });

                    }
                });

            }
        })
    },

    async store(req, res) {

        const { code, p_name, quantity, price } = req.body;

        await query(
            'INSERT INTO products (code, p_name, quantity, price) VALUES ($1, $2, $3, $4)',
            [code, p_name, quantity, price]
        ).then(async () => {
            return res.status(201).send({ message: "Produto criado!", product: { code, p_name, quantity, price } });
        }, (error) => {
            return res.status(400).send({ message: "Produto já existe!", product: null });
        });
    },

    async update(req, res) {

        const { id } = req.params;
        const { p_name, quantity, price } = req.body;

        await query(
            'UPDATE products SET p_name = $1, quantity = $2, price = $3 WHERE code = $4',
            [p_name, quantity, price, id]
        ).then(async (response) => {

            client.get(id, async (err, reply) => {
                if (reply != null) {
                    client.del(id);
                }
            });

            if (response.rowCount) return res.status(200).send({ message: "Produto atualizado!", product: { code: id, p_name, quantity, price } });

            return res.status(404).send({ message: "Produto não encontrado!", product: null });
        });
    },

    async destroy(req, res) {

        const { id } = req.params;

        await query(
            'DELETE FROM products WHERE code = $1',
            [id]
        ).then(async (response) => {

            client.get(id, async (err, reply) => {
                if (reply != null) {
                    client.del(id);
                }
            });

            if (response.rowCount) return res.status(200).send({ message: "Produto excluído!", product: null });

            return res.status(404).send({ message: "Produto não encontrado!", product: null });
        });
    },
};