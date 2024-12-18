#
# npm.add.sh
# -----
# Adds a package via npm and links the project folder 
# in node_modules/ folder. 
# 

# -- install packages 
echo "--- INSTALLING PACKAGES"
npm add $@ 

# --- link wordpaths-word-model/ folder
echo "--- LINKING wordpaths-word-model/ FOLDER"
ln -s ../../wordpaths-word-model node_modules/wordpaths-word-model

# --- link wordpaths-common/ folder
echo "--- LINKING wordpaths-common/ FOLDER"
ln -s ../../wordpaths-common node_modules/wordpaths-common

# --- link project folder
echo "--- LINKING PROJECT FOLDER"
ln -s ../ node_modules/wordpaths-ivfflat

# --- mark as done 
echo "--- DONE"


