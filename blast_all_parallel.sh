cat good_seqs.fasta | \
parallel --block 500k \
--recstart '>' \
--pipe blastn \
-db good_seqs.fasta \
-max_target_seqs 28325 \
-outfmt \'6 qacc sacc length qlen slen pident\' \
-max_hsps 1 \
-num_threads 1 \
-query - > combined_results.txt

