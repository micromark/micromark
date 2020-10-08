root="/Users/ocavue/code/github"

function print_micromark {
    grep -o "require('micromark.*" $(git ls-files | grep '.js')
}

for repo in $(ls $root | grep mdast)
do
    echo ">>>>>>>>>" $repo
    cd $root/$repo
    print_micromark
done
for repo in $(ls $root | grep microma)
do
    echo ">>>>>>>>>" $repo
    cd $root/$repo
    print_micromark
done