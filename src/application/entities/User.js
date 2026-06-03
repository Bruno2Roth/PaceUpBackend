export class User {
  constructor({
    id,
    email,
    password,
    name,
    bio,
    profilePictureUrl,
    dateOfBirth,
    gender,
    city,
    country,
    role = 'USER',
    isActive = true,
    isVerified = false,
    verificationToken,
    verificationTokenExpiresAt,
    passwordResetToken,
    passwordResetExpiresAt,
    lastLogin,
    createdAt,
    updatedAt,
    deletedAt,
  }) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.name = name;
    this.bio = bio;
    this.profilePictureUrl = profilePictureUrl;
    this.dateOfBirth = dateOfBirth;
    this.gender = gender;
    this.city = city;
    this.country = country;
    this.role = role;
    this.isActive = isActive;
    this.isVerified = isVerified;
    this.verificationToken = verificationToken;
    this.verificationTokenExpiresAt = verificationTokenExpiresAt;
    this.passwordResetToken = passwordResetToken;
    this.passwordResetExpiresAt = passwordResetExpiresAt;
    this.lastLogin = lastLogin;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  isAdmin() {
    return this.role === 'ADMIN';
  }

  isModerator() {
    return this.role === 'MODERATOR';
  }

  isRegularUser() {
    return this.role === 'USER';
  }
}

export default User;
