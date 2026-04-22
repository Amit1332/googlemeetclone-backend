const Organization = require("../model/organization.schema");
const User = require("../model/user.schema");

// ✅ Create Organization
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

  // attach org to user
  await User.findByIdAndUpdate(userId, {
    organization: org._id,
  });

  return org;
};

// ✅ Get My Organization
exports.getMyOrganization = async (userId) => {
  const user = await User.findById(userId).populate("organization");

  return user.organization;
};

// ✅ Add Member
exports.addMember = async (orgId, userId, role = "member") => {
  const org = await Organization.findById(orgId);

  if (!org) throw new Error("Organization not found");

  // prevent duplicate
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

  // update user
  await User.findByIdAndUpdate(userId, {
    organization: orgId,
  });

  return org;
};

// ✅ Get Members
exports.getMembers = async (orgId) => {
  const org = await Organization.findById(orgId)
    .populate("members.user", "name email profilePicture");

  if (!org) throw new Error("Organization not found");

  return org.members;
};

// ✅ Remove Member
exports.removeMember = async (orgId, userId) => {
  const org = await Organization.findById(orgId);

  if (!org) throw new Error("Organization not found");

  org.members = org.members.filter(
    (m) => m.user.toString() !== userId
  );

  await org.save();

  // remove org from user
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

// ✅ Delete Organization (Soft Delete Recommended)
exports.deleteOrganization = async (orgId) => {
  const org = await Organization.findById(orgId);

  if (!org) {
    throw new Error("Organization not found");
  }

  // 🔥 Soft delete (recommended)
  org.isActive = false;
  await org.save();

  // 🧹 Remove organization from all users
  await User.updateMany(
    { organization: orgId },
    { $set: { organization: null } }
  );

  return true;
};