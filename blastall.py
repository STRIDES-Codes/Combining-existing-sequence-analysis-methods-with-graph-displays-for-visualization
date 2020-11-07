# -*- coding: utf-8 -*-
"""
Created on Sat Nov  7 08:28:46 2020

@author: connorrp
"""
import subprocess


def blastall(query, subs, count):

    subprocess.call('makeblastdb -in '+subs+' -dbtype nucl -out '+query,
                    shell=True)

    local_blast_cmd = 'blastn -db ' + query + ' -query ' + subs +\
                      ' -max_target_seqs ' + str(count) +\
                      ' -outfmt "6 qacc sacc length qlen slen pident" ' +\
                      '-max_hsps 1 ' + '-num_threads 4 ' +\
                      '-out ' + query + '.tsv'
    subprocess.call(local_blast_cmd, shell=True)
    blast_files = ' '.join([query + x for x in ['.nhr',
                                                '.nin',
                                                '.nsq',
                                                '.fasta']])
    subprocess.call('rm ' + blast_files, shell=True)
