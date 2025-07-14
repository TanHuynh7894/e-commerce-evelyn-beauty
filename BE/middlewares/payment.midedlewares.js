const axios = require('axios');
const crypto = require('crypto');

const getTransactionFromPayOSByOrderCode = async (orderCode) => {
    try {
        const clientId = process.env.PAYOS_CLIENT_ID;
        const apiKey = process.env.PAYOS_API_KEY;
        const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

        // 1 Tạo checksum
        const raw = clientId + orderCode + checksumKey;
        const checksum = crypto.createHash('sha256').update(raw).digest('hex');

        // 2 Gọi API PayOS
        const axios = require('axios');

        const response = await axios.get(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
            headers: {
                'x-client-id': process.env.PAYOS_CLIENT_ID,
                'x-api-key': process.env.PAYOS_API_KEY,
            }
        });

        // 3️ Trả kết quả
        return {
            success: true,
            data: response.data.data,
            message: "Lấy thông tin giao dịch thành công"
        };
    } catch (error) {
        console.error("❌ Lỗi lấy giao dịch từ PayOS:", error.response?.data || error.message);
        return {
            success: false,
            message: "Không lấy được thông tin giao dịch",
            error: error.response?.data || error.message
        };
    }
};

module.exports = {
    getTransactionFromPayOSByOrderCode
};