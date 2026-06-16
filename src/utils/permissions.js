const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getUserPermissions = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/user-permissions`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (data.success) {
            // Update localStorage with fresh user data
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return {
                user: data.user,
                permissions: data.permissions || []
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return null;
    }
};

export const getAllPermissions = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/permissions`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (data.success) {
            return data.permissions;
        }
        return [];
    } catch (error) {
        console.error('Error fetching all permissions:', error);
        return [];
    }
};