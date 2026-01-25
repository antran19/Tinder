/**
 * AuthContext - Dating App
 * File này quản lý trạng thái Đăng nhập của toàn bộ ứng dụng
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Tạo Context (những thông tin sẽ được chia sẻ)
const AuthContext = createContext();

// 2. Hàm Hook để các component khác lấy dữ liệu dễ dàng hơn
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Lưu thông tin người dùng
    const [loading, setLoading] = useState(true); // Trạng thái đang kiểm tra đăng nhập

    // 3. Khi ứng dụng vừa mở lên, kiểm tra xem trong "Ví" (localStorage) có sẵn Token không
    useEffect(() => {
        const savedUser = localStorage.getItem('dating_user');
        const savedToken = localStorage.getItem('dating_token');

        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    /**
     * Hàm Đăng nhập
     * @param {Object} userData - Thông tin từ Backend trả về
     * @param {string} token - Tấm vé Backend trả về
     */
    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('dating_user', JSON.stringify(userData));
        localStorage.setItem('dating_token', token);
    };

    /**
     * Hàm Đăng xuất
     */
    const logout = () => {
        setUser(null);
        localStorage.removeItem('dating_user');
        localStorage.removeItem('dating_token');
        // Reload lại trang để xóa sạch dữ liệu cũ
        window.location.href = '/login';
    };

    /**
     * Hàm Cập nhật thông tin người dùng (không làm mất Token)
     * @param {Object} newUserData 
     */
    const updateUserData = (newUserData) => {
        const updatedUser = { ...user, ...newUserData };
        setUser(updatedUser);
        localStorage.setItem('dating_user', JSON.stringify(updatedUser));
    };

    // Những giá trị sẽ "phát" đi cho các component con dùng
    const value = {
        user,
        isAuthenticated: !!user, // Kiểm tra xem đã đăng nhập chưa (true/false)
        login,
        logout,
        updateUserData,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
