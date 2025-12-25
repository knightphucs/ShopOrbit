export type RegisterPayload = {
    fullName: string;
    username: string;
    email: string;
    password: string;
};

export type LoginPayload = {
    username: string;
    password: string;
};

export type AuthResponse = {
    message?: string;
    Message?: string;
    token?: string;
    expiration?: string;
};
