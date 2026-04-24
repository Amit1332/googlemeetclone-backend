const Organization = require("../model/organization.schema");
const User = require("../model/user.schema");
const { generateStrongPassword } = require("../utils/passwordGenerator");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

// ? Create Organization
exports.createOrganization = async (userId, name) => {
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const org = await Organization.create({
    name,
    slug,
    owner: userId,
    members: [
      {
        user: userId,
        role: "admin",
      },
    ],
  });

  await User.findByIdAndUpdate(userId, {
    organization: org._id,
  });

  return org;
};

// ? Get My Organization
exports.getMyOrganization = async (userId) => {
  const user = await User.findById(userId).populate("organization");

  return user.organization;
};

// ? Add Member
exports.addMember = async (orgId, userId, role = "member") => {
  const org = await Organization.findById(orgId);

  if (!org) throw new Error("Organization not found");

  const alreadyMember = org.members.some(
    (m) => m.user.toString() === userId
  );

  if (alreadyMember) {
    throw new Error("User already a member");
  }

  org.members.push({
    user: userId,
    role,
  });

  await org.save();

  await User.findByIdAndUpdate(userId, {
    organization: orgId,
  });

  return org;
};

exports.createMemberAccount = async (orgId, payload = {}) => {
  const { name, email, role = "member" } = payload;

  if (!name?.trim()) {
    throw new Error("Member name is required");
  }

  if (!email?.trim()) {
    throw new Error("Member email is required");
  }

  const org = await Organization.findById(orgId);
  if (!org) {
    throw new Error("Organization not found");
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const password = generateStrongPassword(14);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    organization: orgId,
    status: "offline",
  });

  org.members.push({
    user: user._id,
    role,
  });
  await org.save();

  const createdUser = await User.findById(user._id).select("name email profilePicture organization");

  return {
    member: createdUser,
    credentials: {
      email: normalizedEmail,
      password,
    },
  };
};

// ? Get Members
exports.getMembers = async (orgId) => {
  const org = await Organization.findById(orgId)
    .populate("members.user", "name email profilePicture");

  if (!org) throw new Error("Organization not found");

  return org.members;
};

// ? Remove Member
exports.removeMember = async (orgId, userId) => {
  const org = await Organization.findById(orgId);

  if (!org) throw new Error("Organization not found");

  org.members = org.members.filter(
    (m) => m.user.toString() !== userId
  );

  await org.save();

  await User.findByIdAndUpdate(userId, {
    organization: null,
  });

  return org;
};

exports.getAllOrganizations = async () => {
  return await Organization.find({ isActive: true })
    .populate("owner", "name email")
    .populate("members.user", "name email");
};

// ? Delete Organization (Soft Delete Recommended)
exports.deleteOrganization = async (orgId) => {
  const org = await Organization.findById(orgId);

  if (!org) {
    throw new Error("Organization not found");
  }

  org.isActive = false;
  await org.save();

  await User.updateMany(
    { organization: orgId },
    { $set: { organization: null } }
  );

  return true;
};
