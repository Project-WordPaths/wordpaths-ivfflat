#
# pip.add.sh
# -----
# Adds a package via pip and updates requirements.txt
# 

# -- virtual environment 
echo "--- CREATING env/ FOLDER [IF NECESSARY]"
if [ ! -d env/ ] 
then 
    python3 -m pip install virtualenv
    virtualenv env
fi 
source env/bin/activate

# -- install packages 
echo "--- INSTALLING PACKAGES"
python3 -m pip install $@

# --- link project folder
echo "--- UPDATING requirements.txt"
python3 -m pip freeze > requirements.txt

# --- mark as done 
echo "--- DONE"


