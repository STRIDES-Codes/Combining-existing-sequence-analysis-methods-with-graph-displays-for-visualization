blast_output = "../combined_results.txt"
distance_file = "../combined_results_distances.tsv"
cluster_file = "" # TODO

rule get_sequences:
    output:
        "goodseqs.fasta"
    shell:
        "python preprocessing/get_seqs.py" # TODO: Args

rule blast_all:
    input:
        "goodseqs.fasta"
    output:
        blast_output
    shell:
        "python preprocessing/blastall.py" #TODO: Args

rule compute_distances:
    input:
        blast_output
    output:
        distance_file
    shell:
        "python preprocessing/computedistances.py " +
        "-i {input} -o {output} " +
        "--distance-metric short_hamming " +
        "-f 'qacc sacc length qlen slen pident'"

rule calculate_clusters:
    input:
        distance_file
    output:
        cluster_file
    shell:
        "" # TODO
